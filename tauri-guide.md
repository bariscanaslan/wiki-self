# Tauri Masaüstü İstemcisi — Keşif ve Planlama Raporu

> Tarih: 2026-08-14
> Kapsam: Yalnızca yerel mod (sidecar + static frontend + SQLite). Senkronizasyon, CRDT, mobil istemci ve auto-updater implementasyonu kapsam dışı.

## 1. Bulgular

### 1.1 Next.js static export uygunluğu — beklenenden çok daha az sorunlu

- `frontend/next.config.ts:6` → şu anda `output: "standalone"` (Next.js **sunucu** modu, `node server.js` ile çalışıyor). Bu, `output: "export"` ile **birbirini dışlayan** iki mod — export için ayrı bir config yolu gerekiyor.
- Next.js **16.3.0**, React **19.2.8**.
- `middleware.ts` **repo genelinde hiç yok** → mimari bir değişiklik/yerine geçecek bir şey gerekmiyor.
- `route.ts` (API route handler) **hiç yok**.
- `next/image` **hiç kullanılmıyor** → image-loader göçü gerekmiyor.
- `"use server"`, `cookies()`, `headers()`, `NextResponse` **hiç kullanılmıyor**.
- `next/font/google` kullanılıyor (`app/layout.tsx:4,11-15` — Inter, Roboto, Merriweather, Lora, Poppins). Static export ile sorunsuz çalışır (fontlar build zamanında indirilip self-host edilir); tek yapılacak, deneme build'inde `out/` altına doğru yerleştiğini doğrulamak. **Kolay.**
- `app/` altındaki 17 route dosyasının tamamı ya `"use client"` ya da server-side veri çekmeyen server component (sadece bir client component'i sarmalıyor: `admin/audit`, `admin/permissions`, `admin/settings`, `admin/users`, `admin/groups`, `account/security`). **Kolay.**
- Uygulama zaten `lib/api/*` altında react-query tabanlı bir client-side API katmanına ve `lib/auth/AuthContext`'e sahip — sayfalar zaten SPA tarzı client-side veri çekiyor. Taşınacak "legacy server fetch" paterni yok.
- **Gerçek sorun (tek kalem): 2 dinamik route, `generateStaticParams` yok:**
  - `app/(app)/documents/[id]/page.tsx`
  - `app/(app)/admin/groups/[id]/page.tsx`

  Bu ID'ler kullanıcı verisi (build zamanında bilinemez), dolayısıyla `output: 'export'` ile `next build` bu iki route'ta başarısız olur. İki standart çözüm var: (a) query-string routing'e geçmek (`/documents?id=xxx`), (b) path şeklini koruyup bir shell HTML üretip ID'yi client-side `window.location` üzerinden okumak (host/Tauri sunucu tarafında path fallback yapılandırması gerektirir, daha kırılgan). En az bir çağrı noktası zaten tespit edildi: `app/(app)/search/page.tsx:70`. Diğer `Link`/`router.push` çağrı noktalarının tam listesi uygulama adımında çıkarılmalı.
  - `search/page.tsx` zaten `useSearchParams()` + `<Suspense>` doğru paternini kullanıyor (`page.tsx:101-107`) — export ile uyumlu, örnek olarak referans alınabilir.

**Sonuç:** Bu madde en riskli olarak işaretlenmişti ama pratikte tek gerçek karar noktası dinamik route şeması. Gerisi ya zaten uyumlu ya da tek satırlık config değişikliği.

### 1.2 Backend — Postgres'e özgü kod

- `Program.cs:23` — `options.UseNpgsql(...)`: tek, hardcoded provider kayıt noktası.
- `Data/AppDbContextFactory.cs:11` — design-time factory da `UseNpgsql(...)` + inline connection string ile hardcoded. Provider'a göre parametrize değil.
- `Data/Configurations/DocumentConfiguration.cs:24-29` — `HasGeneratedTsVectorColumn(..., "english", ...).HasIndex(...).HasMethod("GIN")`: Postgres generated tsvector kolonu + GIN index. SQLite'ta doğrudan karşılığı yok (FTS5 ayrı bir virtual table gerektirir, generated column değil).
- `Entities/Document.cs:1,18` — `NpgsqlTsVector SearchVector` property'si **doğrudan entity üzerinde**. Bu tip Postgres'e özgü — entity'nin kendisi bugün provider-agnostic değil.
- `Services/SearchService.cs:41,52` — `EF.Functions.WebSearchToTsQuery(...)` ile arama + ranking. SQLite'ta çevirisi yok.
- `jsonb` kolon tipi: `DocumentVersionConfiguration.cs:15-17`, `AuditLogConfiguration.cs:15-16`. SQLite'ta `TEXT`'e düşer; sorgu tarafında JSON operatörü kullanılmadığı için düşük risk.
- `HasDefaultValueSql("now()")` — 7 config dosyasında (`AssetConfiguration.cs:28`, `FolderConfiguration.cs:30`, `DocumentVersionConfiguration.cs:23`, `AuditLogConfiguration.cs:19`, `DocumentConfiguration.cs:32,35`, `UserConfiguration.cs:29`). SQLite'ta `now()` yok, karşılığı `CURRENT_TIMESTAMP` — her biri provider-özel override gerektirir ya da zaman damgası C# tarafında set edilmeli.
- Raw SQL (`FromSqlRaw`/`ExecuteSqlRaw`), `ILike`, array kolon tipi, `timestamptz`'e özel C# kodu **bulunamadı** — yukarıdakiler dışında temiz.

### 1.3 Arama servisi mimarisi

- `Services/ISearchService.cs` — tek metotlu arayüz, DI'da kayıtlı (`Program.cs:36`). İkinci implementasyon (SQLite FTS5) DI seviyesinde temiz şekilde eklenebilir.
- **İyi haber:** Yetki filtreleme zaten ayrı bir katman. `SearchService.cs:38-72` FTS sorgusuyla adayları (≤500) çekiyor, `:74-77`'de `_permissionService.GetEffectiveDocumentPermissionsAsync(...)` çağrılıp sonuçlar **C# tarafında, bellekte** filtreleniyor — FTS SQL/LINQ sorgusuna gömülü değil. İstenen "yetki mantığı ortak katmanda kalsın" tasarımıyla zaten örtüşüyor.
- **Ama:** Servis şu an tam `Document` entity'leri döndürüyor (`.Include(d => d.Folder)`), ID kümesi değil. Hedeflenen tasarıma (arama servisi yalnızca aday ID döndürsün) ulaşmak için FTS'e özgü kısmın `IEnumerable<Guid>` (veya `(Guid, float Rank)`) döndürecek şekilde ayrıştırılması, entity yükleme + yetki filtrelemenin ortak katmanda kalması gerekiyor.
- `Rank` alanı zaten `float` (provider-agnostic tip), sadece SQLite tarafında `bm25()` ile doldurulacak.

### 1.4 DbContext / migration yapısı

- Tek `AppDbContext` (`Data/AppDbContext.cs`), `OnModelCreating` içinde provider-koşullu mantık yok, sadece `ApplyConfigurationsFromAssembly`.
- `Migrations/` **düz, tek klasör** — `InitialCreate`, `AddFolderIcon`, `AddTwoFactorAuth`, `RemoveCategories` — hepsi Npgsql tipleriyle (`uuid`, `jsonb`, `timestamp with time zone`, `NpgsqlModelBuilderExtensions...`).
- Tek `IDesignTimeDbContextFactory<AppDbContext>` var, hardcoded `UseNpgsql` + literal connection string — provider seçimi yok.
- Yukarıdakiler dışında ek provider-özel model config bulunamadı (13 config dosyasında başka value converter/column-type override yok).

### 1.5 AssetStorage:RootPath

- `appsettings.json:19-21` — varsayılan `"AssetStorage"`.
- `Services/AssetService.cs:20-26` — yol mutlak değilse `AppContext.BaseDirectory`'ye göre çözülüyor (yürütülebilir dosyanın yanı). Docker'da muhtemelen bir named volume ile destekleniyor (`docker-compose.yml`'da `backend_assets:/app/AssetStorage`, bkz. 1.9). Self-contained single-file publish'te `AppContext.BaseDirectory`'nin her platformda yazılabilir/uygun olmayabileceği için masaüstünde OS kullanıcı veri dizinine geçiş gerekiyor.

### 1.6 .csproj / publish hazırlığı

- Tek proje: `backend/src/WikiSelf/WikiSelf.csproj`, `TargetFramework: net10.0`.
- `RuntimeIdentifier(s)`, `PublishSingleFile`, `PublishTrimmed`, `SelfContained` — **hiçbiri tanımlı değil**, sıfırdan kurulacak.
- `Microsoft.EntityFrameworkCore.Sqlite` **repoda hiçbir yerde referans edilmiyor** — ne test projesi ne başka bir emsal var (tek `.csproj` bu).

### 1.7 Kimlik doğrulama akışı

**Backend** (`Controllers/AuthController.cs`, `Services/Auth/*`):
- Yalnızca JWT bearer, cookie yok. Endpoint'ler: `login`, `2fa/verify`, `2fa/setup|enable|disable`, `refresh` (`[AllowAnonymous]`), `logout`, `me`, `verify-password`, `change-password`.
- `JwtSettings.cs:8-9` — `AccessTokenExpirationMinutes = 15`, `RefreshTokenExpirationDays = 30` (varsayılan, config ile override edilebilir, `"Jwt"` bölümü).
- İmzalama anahtarı config'ten okunuyor (`Program.cs:47,64`), fallback/otomatik üretim yok.
- Refresh token'lar DB'de, **rotate-on-use** paterniyle (`Entities/RefreshToken.cs`, `TokenHash` = SHA-256, `AuthService.RefreshAsync:266-303` eskisini iptal edip yenisini yazıyor).
- Şifre hash: BCrypt.Net. 2FA: TOTP (OtpNet) + BCrypt-hashli recovery code'lar — tamamen local, harici IdP bağımlılığı yok.

**Frontend** (`lib/auth/token-store.ts`, `lib/auth/AuthContext.tsx`):
- Access token **yalnızca bellekte** (`token-store.ts:5,10`). Refresh token bellekte + `localStorage` (`"wikiself.refreshToken"`, `:3,17-30`).
- `AuthProvider` mount olduğunda persisted refresh token'ı okuyup hemen `/api/auth/refresh` sonra `/api/auth/me` çağırıyor (`AuthContext.tsx:32-66`) — oturum başlatmanın tek yolu bu.
- Route koruması **tamamen client-side**: `middleware.ts` yok, `app/(app)/layout.tsx:42-53` bir `useEffect` içinde `router.replace` ile yönlendiriyor.

### 1.8 API client / base URL

- Tek kaynak: `frontend/lib/api/client.ts:5` — `API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7000"`. Repo genelinde bu env var'ı okuyan **tek dosya bu**.
- Her şey buradan geçiyor: `apiClient` (axios instance, `:28-30`), auth interceptor (`:32-38`), 401→refresh→retry interceptor'ı (`:40-86`), `resolveAssetUrl()` (`:7-17`) de `API_BASE_URL`'den türetiyor.
- **Engel:** `NEXT_PUBLIC_*` değişkenleri Next.js tarafından client bundle'a **build zamanında** gömülür — bu değer statik export'a donmuş halde girer, runtime'da değişemez. Bugün hiçbir runtime-config mekanizması (next.config `env`/`publicRuntimeConfig` vb.) yok.
- **İyi haber:** Etki alanı küçük — tek, 105 satırlık dosya, tek export (`API_BASE_URL`), her şey buradan türüyor. Merkezi bir düzeltme yeterli.

### 1.9 Build / Docker / nginx / CI — mevcut durum

- `docker-compose.yml`: `db` (postgres:16-alpine), `backend`, `frontend`, `nginx` servisleri. Yalnızca `nginx` host portu yayınlıyor (8093). Named volume'ler: `db_data`, `backend_assets` — host bind mount yok.
- `frontend` build arg'ı `NEXT_PUBLIC_API_URL=""` — **bilinçli olarak boş/relatif**, nginx aynı-origin proxy'si için (Dockerfile'da yorum satırıyla açıkça belirtilmiş) — masaüstü için çözülmesi gereken tam da bu kısıt.
- `nginx/default.conf`: `/api/` → `backend:7000` (rewrite yok), `/` → `frontend:3000`, `client_max_body_size 25m` (yükleme limiti — Kestrel tarafında karşılığı yok, sidecar nginx'siz çalışınca bu limit ya Kestrel'de yeniden tanımlanmalı ya sınırsız kalır). CORS nginx'te değil, backend'de `Cors__AllowedOrigins__0` env var'ıyla yönetiliyor.
- `backend/Dockerfile`: SDK/runtime `10.0` Debian tabanlı (glibc, musl değil), **framework-dependent publish** — RID, self-contained, trimming flag'lerinin hiçbiri yok. `libgssapi-krb5-2` kuruluyor (Npgsql/Kerberos'a özgü, SQLite sidecar için gereksiz).
- `frontend/Dockerfile`: `node:22-alpine`, mevcut `next.config.ts` zaten `output: "standalone"` — export için ayrı config yolu gerektiğini doğruluyor (bkz. 1.1).
- **CI: `.github/workflows/` hiç yok — bugün hiçbir otomasyon çalışmıyor.**
- `.env.example`: `POSTGRES_DB/USER/PASSWORD`, `JWT_SECRET`, `PUBLIC_ORIGIN` (varsayılan `8082`, ama gerçek port her yerde `8093` — küçük bir tutarsızlık, bilgi amaçlı not).

## 2. Bloke edici konular (kodlamaya başlamadan önce karara bağlanmalı)

1. **Dinamik route şeması**: `documents/[id]` ve `admin/groups/[id]` için query-string mi, path+client-read mi? Bu karar frontend routing'inin tamamını (Link/router.push çağrıları) etkiliyor.
2. **Search entity/config ayrıştırması**: `NpgsqlTsVector SearchVector`, `Document` entity'sinin kendisinde ve paylaşılan `DocumentConfiguration`'da yaşıyor. SQLite desteği için bu ya (a) Postgres-only config dosyasına taşınıp SQLite tarafı harici FTS5 virtual table kullanacak şekilde ayrılmalı, ya da (b) `OnModelCreating`'de provider'a göre koşullu uygulanmalı. Bu, DbContext/migration ayrımının temel tasarım kararı — henüz verilmedi.
3. **Migration stratejisi**: İkinci migration seti (`Migrations/Sqlite`) + provider-aware design-time factory nasıl seçilecek (env var mı, ayrı proje mi)? Karara bağlanmalı.
4. **API base URL runtime çözümü**: `lib/api/client.ts`'in build-time inlining modelinden çıkıp sidecar'ın dinamik portunu runtime'da öğrenmesi gerekiyor — cloud build davranışını bozmadan. Somut mekanizma (Tauri IPC çağrısı / global `window` değişkeni / ilk yüklemede okunan bir dosya) henüz seçilmedi.
5. **AssetStorage hedef dizini**: Platform başına hangi OS kullanıcı veri dizini kullanılacak? (bkz. Riskler)
6. **Kimlik doğrulama offline politikası**: JWT süresi dolduğunda offline'da ne olacak — karar user'da, öneri seti aşağıda (bölüm 6).
7. **Upload boyut limiti**: nginx'in `client_max_body_size 25m`'i sidecar'da Kestrel tarafında nasıl karşılanacak?

## 3. Önerilen yerleşim

```
wiki-self/
├── backend/
├── frontend/
├── nginx/
├── desktop/
│   ├── src-tauri/
│   │   ├── tauri.conf.json
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   ├── icons/
│   │   ├── capabilities/
│   │   └── binaries/        (gitignore — publish script'in WikiSelf.Api çıktısını
│   │                          buraya kopyaladığı yer, externalBin hedefi)
│   └── README.md            (yerel geliştirme + build talimatları)
├── docker-compose.yml
└── .env.example
```

**Neden `desktop/src-tauri/` ve `frontend/src-tauri/` değil:** Tauri uygulaması iki ayrı build çıktısını (frontend static export + backend self-contained binary) tüketen bir "orkestratör". Bunu `frontend/` altına gömmek, Rust/Tauri toolchain'ini frontend paketiyle karıştırır ve semantik olarak yanlış olur — Tauri kabuğu frontend'in bir parçası değil, frontend+backend'i saran ayrı bir dağıtım hedefi. Mevcut `backend/`/`frontend/`/`nginx/` kardeş-dizin paterniyle tutarlı olması için `desktop/` kök seviyede duruyor; `desktop/src-tauri` Tauri CLI'nin varsayılan iskelet adı.

`tauri.conf.json`'daki `frontendDist`, `frontend/`'in export çıktısını (örn. `frontend/out`) relatif yol ile işaret eder — export çıktısının frontend içinde mi (`frontend/out`) yoksa `desktop/frontend-dist`'e kopyalanarak mı tutulacağı, uygulama planında ayrı bir adımda netleştirilecek küçük bir tercih.

## 4. Uygulama planı

Adım 0 dışındaki her adım bağımsız doğrulanabilir ve sırayla ilerler.

**Adım 0 — Karar noktalarını kapat**
Bölüm 2'deki 7 madde (routing şeması, search ayrıştırma yaklaşımı, migration stratejisi, API URL keşif mekanizması, asset dizini, auth offline politikası, upload limiti) üzerinde onay alınır. Kod yazılmaz.

**Adım 1 — Backend: SQLite provider'ı ekle**
`WikiSelf.csproj`'a `Microsoft.EntityFrameworkCore.Sqlite` eklenir; `Program.cs`'te provider seçimi config/env var ile koşullu hale getirilir (`UseNpgsql` vs `UseSqlite`), `AppDbContextFactory` provider-aware yapılır.
*Test:* `dotnet build` geçer, mevcut Postgres yolu değişmeden çalışmaya devam eder (docker-compose ile smoke test).

**Adım 2 — Backend: Document/arama config'ini provider'a göre ayır**
`DocumentConfiguration`'daki tsvector/GIN kısmı Postgres-only bir config dosyasına taşınır; `NpgsqlTsVector SearchVector` entity üzerinden çıkarılır ya da provider-koşullu map edilir. SQLite tarafı için henüz FTS5 tablosu kurulmaz, sadece entity/config'in provider-agnostic hale gelmesi sağlanır.
*Test:* Postgres migration/model snapshot değişmeden `dotnet ef migrations add` çalışır, mevcut Postgres testleri (varsa) geçer.

**Adım 3 — Backend: SQLite migration seti**
`Migrations/Sqlite` klasörü + ayrı `ModelSnapshot`, `dotnet ef migrations add InitialCreate --context ... -o Migrations/Sqlite` ile üretilir.
*Test:* Boş bir SQLite dosyasına migration uygulanır, tablo şeması manuel incelenir.

**Adım 4 — Backend: `ISearchService`'i candidate-ID odaklı yeniden şekillendir**
FTS-özgü kısım `IEnumerable<Guid>`/`(Guid, float Rank)` döndürecek şekilde ayrılır; entity yükleme + yetki filtreleme paylaşımlı katmanda kalır (mevcut `SearchService.cs:74-77` paterni korunur).
*Test:* Mevcut Postgres arama endpoint'i aynı sonuçları döner (regresyon testi).

**Adım 5 — Backend: SQLite FTS5 arama implementasyonu**
`SqliteFts5SearchService` eklenir, harici FTS5 virtual table + trigger senkronizasyonu kurulur, DI'da provider'a göre seçilir.
*Test:* SQLite üzerinde örnek dokümanlarla arama sorgusu, sonuçların ve yetki filtrelemesinin doğruluğu manuel doğrulanır.

**Adım 6 — Backend: AssetStorage hedef dizini**
`AssetStorageSettings.RootPath` masaüstü profilinde OS kullanıcı veri dizinine (karar Adım 0'da netleşir) işaret edecek şekilde config/ortam değişkeniyle override edilir; Docker/cloud davranışı değişmez.
*Test:* Masaüstü profiliyle başlatılan backend'de dosya yükleme, dosyanın beklenen dizine yazıldığının doğrulanması.

**Adım 7 — Backend: publish ayarları**
`.csproj`'a `RuntimeIdentifiers` (macOS: `osx-x64`/`osx-arm64`, Windows: `win-x64`, Linux: `linux-x64`), `SelfContained=true`, `PublishSingleFile=true` eklenir. `PublishTrimmed` **başlangıçta kapalı tutulur** (EF Core reflection riski — bkz. Riskler); ihtiyaç doğrulanınca ayrı bir adımda denenir.
*Test:* Her RID için `dotnet publish` çalıştırılır, üretilen tekil binary bağımsız olarak (Docker dışında) elle başlatılıp `/health` gibi bir endpoint'e istek atılır.

**Adım 8 — Frontend: export-mode config**
`next.config.ts` env-koşullu hale getirilir (ya da ayrı `next.config.export.ts` + build script) — cloud build (`standalone`) davranışı değişmeden export modu eklenir.
*Test:* `next build` her iki modda da (standalone ve export) hatasız tamamlanır.

**Adım 9 — Frontend: dinamik route göçü**
Adım 0'da seçilen şemaya göre `documents/[id]` ve `admin/groups/[id]` dönüştürülür, tüm `Link`/`router.push` çağrı noktaları güncellenir.
*Test:* `next build` (export modunda) hatasız biter, `out/` altında beklenen HTML dosyaları oluşur, tarayıcıda `out/` statik olarak servis edilip doküman/grup detay sayfalarına gidilebiliyor mu manuel doğrulanır.

**Adım 10 — Frontend: runtime API URL keşfi**
`lib/api/client.ts`, build-time `NEXT_PUBLIC_API_URL`'e ek olarak runtime'da (Adım 0'da seçilen mekanizmayla) base URL'i öğrenecek şekilde değiştirilir; cloud/Docker build'inde davranış aynı kalır.
*Test:* Cloud Docker stack'i (mevcut `docker-compose.yml`) hiç değişmeden ayağa kalkar ve çalışır (regresyon); ayrıca manuel olarak sahte bir runtime-URL enjeksiyonuyla client'in doğru adrese istek attığı doğrulanır.

**Adım 11 — Tauri: iskelet**
`desktop/src-tauri` oluşturulur (`tauri init` benzeri), `frontendDist` `frontend/out`'a işaret eder, boş/placeholder sidecar ile "Hello World" seviyesinde pencere açılır.
*Test:* `tauri dev`/`tauri build` ile pencere açılıp frontend statik dosyaları render ediyor mu (backend olmadan, sadece UI iskeleti).

**Adım 12 — Tauri: sidecar entegrasyonu**
Adım 7'nin publish çıktısı `externalBin` konvansiyonuna uygun isimlendirmeyle `binaries/`'e kopyalanır (build script). Sidecar process başlatılır, dinamik port tahsis edilir, port bilgisi Tauri'ye iletilir (stdout parse ya da benzeri — Adım 0'da netleşecek somut mekanizma).
*Test:* Uygulama açıldığında sidecar arka planda başlıyor, frontend keşfettiği portla `/health` çağrısı yapıp yanıt alıyor mu.

**Adım 13 — Tauri: yaşam döngüsü ve güvenlik**
Uygulama kapanırken sidecar process'inin güvenilir şekilde sonlandırılması (Windows'ta orphan process riskine karşı process group/job object kullanımı), sidecar'ın yalnızca `127.0.0.1`'e bind olduğunun doğrulanması (appsettings/Kestrel binding ayarı).
*Test:* Uygulama kapatıldıktan sonra `ps`/Task Manager'da sidecar process'inin kalmadığı doğrulanır (özellikle Windows); `netstat`/`lsof` ile sidecar'ın yalnızca localhost'ta dinlediği doğrulanır.

**Adım 14 — Auth: offline politikasının uygulanması**
Adım 0'da seçilen yaklaşım (bölüm 6'daki öneri setinden) implement edilir.
*Test:* Uygulama offline açılıp önceden giriş yapılmış kullanıcı oturumunun (seçilen politikaya göre) beklenen şekilde devam ettiği/istendiği doğrulanır.

**Adım 15 — CI taslağı**
`.github/workflows/desktop-build.yml` — macOS/Windows/Ubuntu runner matrisi: `.NET publish` → `Next export` → `tauri build` sırası, platform başına gerekli ortam (Rust toolchain, .NET SDK, Node) kurulumu.
*Test:* Her üç runner'da workflow'un yeşil tamamlandığı, üretilen bundle'ların artifact olarak indirilebildiği doğrulanır.

## 5. Riskler ve belirsizlikler

- **EF Core + `PublishTrimmed`**: EF Core reflection/dynamic proxy kullanır, trimming genelde çalışma-zamanı hatalarına yol açar — bu doğrulanmalı, başlangıçta kapalı tutulması öneriliyor.
- **SQLite FTS5 ranking farkı**: `bm25()` ile Postgres `ts_rank`'in sonuç sıralaması farklı olacak — kullanıcı aynı sorguda farklı sıralama görebilir, bu bir üründe kabul edilebilir mi doğrulanmalı.
- **`SearchVector`/entity ayrıştırmasının tam kapsamı ölçülmedi** — bu oturumdaki araştırma bunu kapsam dışı bıraktı, Adım 2'de tam grep yapılmalı.
- **Dinamik route çağrı noktalarının tam listesi çıkarılmadı** — `search/page.tsx:70` dışında başka `Link`/`router.push` kullanımları olabilir, Adım 9'da tam taranmalı.
- **Tauri v2'de sidecar'ın dinamik portunu ana sürece bildirme yöntemi burada doğrulanmadı** — stdout parse konvansiyonel bir yaklaşım ama Tauri v2 `externalBin` dokümantasyonuyla teyit edilmeli.
- **Windows'ta orphan process önleme API'si** — Tauri v2'nin bu konudaki somut garantisi (process group/job object desteği) versiyon bazlı değişebilir, doğrulanmalı.
- **Auto-updater mimari etkisi** (kapsam dışı ama not istendi): self-contained sidecar ile Tauri updater'ın ayrı ayrı güncellenmesi senkronize olmalı — versiyon uyumluluk kontratı bu oturumda tasarlanmadı, sync aşamasından önce netleştirilmeli.
- **CORS/origin**: sidecar nginx'siz çalışınca backend `Cors:AllowedOrigins` ayarının Tauri webview origin'ini (platforma göre değişebilir — macOS/Linux'ta `tauri://localhost`, Windows'ta `http://tauri.localhost` gibi) içermesi gerekecek — bu doğrulanmalı.
- **Upload boyut limiti**: nginx'in `client_max_body_size 25m`'inin Kestrel karşılığı bugün yok, sidecar'da bu limitin nasıl uygulanacağı belirsiz.
- **AssetStorage hedef dizini**: hangi platform kütüphanesi/konvansiyonuyla (örn. Tauri'nin `app_data_dir()` API'si) belirleneceği henüz seçilmedi.
- **JWT offline politikası henüz karara bağlanmadı** — aşağıda öneri seti var, karar user'da.

### Kimlik doğrulama — öneri seti (karar değil)

- **Seçenek A — Access token ömrünü masaüstü profili için uzat**: Mevcut mimariye en az dokunuş (sadece `Jwt:AccessTokenExpirationMinutes` config değişikliği, masaüstü sidecar'ı için ayrı bir profil). Risk: token çalınırsa geniş pencere; ama sidecar zaten yalnızca `127.0.0.1`'e bağlı olduğu için dışarıdan erişim riski düşük.
- **Seçenek B — Refresh token'ı uzun ömürlü tut + OS keychain'de sakla**: `Jwt:RefreshTokenExpirationDays`'i masaüstü için büyük bir değere çıkarmak (örn. 365 gün) + Tauri tarafında token'ı `localStorage` yerine Stronghold/keychain plugin ile saklamak. Backend'de yalnızca config değişikliği, frontend'de depolama katmanı değişikliği gerekir; mevcut rotate-on-use mekanizması korunur.
- **Seçenek C — Cihaza özgü yerel kimlik doğrulama**: Backend'e yeni bir "device credential" akışı eklemek (OS keychain'de saklanan bir cihaz secret'ıyla sessiz yeniden oturum açma). En güvenli ama en fazla yeni yüzey — mevcut refresh-token rotasyonuna ek bir katman.

Üçü de mevcut auth mimarisini (JWT + rotate-on-use refresh token) koruyor, aralarındaki fark güvenlik/basitlik dengesi. Sync aşaması henüz devrede olmadığı için "token çalınması" riskinin masaüstü-offline bağlamında ne kadar önemsendiği kullanıcı tercihine bağlı.

## Yıkıcı/geri alınamaz komutlar

Bu oturumda yalnızca araştırma yapıldı, kod yazılmadı; önerilen hiçbir adım dosya silen, sıfırlayan veya geri alınamaz bir komut içermiyor.
