"use client";

import { FileText } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useSearch } from "@/lib/api/search";

const PAGE_SIZE = 20;

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const { data, isLoading, isFetching } = useSearch(query, page, PAGE_SIZE);

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`/search?${params.toString()}`);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE)) : 1;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 text-xl font-bold text-zinc-900">Arama Sonuçları</h1>
      <p className="mb-6 text-sm text-zinc-500">
        {query ? (
          <>
            &quot;{query}&quot; için {data?.totalCount ?? 0} sonuç bulundu
          </>
        ) : (
          "Aramak için bir kelime girin"
        )}
      </p>

      {(isLoading || isFetching) && (
        <div className="flex justify-center py-16">
          <Spinner className="text-primary-500" />
        </div>
      )}

      {!isLoading && !isFetching && data?.results.length === 0 && (
        <EmptyState icon={FileText} title="Sonuç bulunamadı" description="Farklı bir arama terimi deneyin." />
      )}

      <div className="flex flex-col gap-3">
        {!isLoading &&
          !isFetching &&
          data?.results.map((result) => (
            <Link
              key={result.documentId}
              href={`/documents/${result.documentId}`}
              className="rounded-xl border border-zinc-100 bg-white p-4 transition-colors hover:border-primary-200 hover:bg-primary-50/40"
            >
              <div className="flex items-start gap-3">
                <FileText size={18} className="mt-0.5 shrink-0 text-primary-500" />
                <div>
                  <h2 className="font-semibold text-zinc-900">{result.title}</h2>
                  <p className="mt-1 text-sm text-zinc-500">{result.snippet}</p>
                </div>
              </div>
            </Link>
          ))}
      </div>

      {data && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            Önceki
          </Button>
          <span className="text-xs text-zinc-500">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
            Sonraki
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Spinner className="text-primary-500" /></div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
