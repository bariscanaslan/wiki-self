"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { FileDropInput } from "@/components/setup/FileDropInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { useUploadAsset } from "@/lib/api/assets";
import { extractAssetId, extractErrorMessage, resolveAssetUrl } from "@/lib/api/client";
import { useSettings, useUpdateSettings } from "@/lib/api/settings";
import { AVAILABLE_FONTS } from "@/lib/settings/fonts";
import type { SiteSettingsResponse } from "@/lib/types";

export function SettingsForm() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const uploadAsset = useUploadAsset();

  const [prevSettings, setPrevSettings] = useState<SiteSettingsResponse | undefined>(settings);
  const [companyName, setCompanyName] = useState(settings?.companyName ?? "");
  const [siteTitle, setSiteTitle] = useState(settings?.siteTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(settings?.metaDescription ?? "");
  const [uiFont, setUiFont] = useState(settings?.uiFont ?? "Inter");
  const [documentFont, setDocumentFont] = useState(settings?.documentFont ?? "Inter");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoAssetId, setLogoAssetId] = useState<string | null>(extractAssetId(settings?.logoUrl));
  const [faviconAssetId, setFaviconAssetId] = useState<string | null>(extractAssetId(settings?.faviconUrl));

  if (settings !== prevSettings) {
    setPrevSettings(settings);
    if (settings) {
      setCompanyName(settings.companyName);
      setSiteTitle(settings.siteTitle);
      setMetaDescription(settings.metaDescription ?? "");
      setUiFont(settings.uiFont);
      setDocumentFont(settings.documentFont);
      setLogoAssetId(extractAssetId(settings.logoUrl));
      setFaviconAssetId(extractAssetId(settings.faviconUrl));
    }
  }

  if (isLoading || !settings) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="text-primary-500" />
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      let resolvedLogoAssetId = logoAssetId;
      let resolvedFaviconAssetId = faviconAssetId;

      if (logoFile) {
        const asset = await uploadAsset.mutateAsync({ file: logoFile });
        resolvedLogoAssetId = asset.id;
      }

      if (faviconFile) {
        const asset = await uploadAsset.mutateAsync({ file: faviconFile });
        resolvedFaviconAssetId = asset.id;
      }

      await updateSettings.mutateAsync({
        companyName: companyName.trim(),
        siteTitle: siteTitle.trim(),
        metaDescription: metaDescription.trim() || undefined,
        uiFont,
        documentFont,
        logoAssetId: resolvedLogoAssetId,
        faviconAssetId: resolvedFaviconAssetId,
      });

      setLogoAssetId(resolvedLogoAssetId);
      setFaviconAssetId(resolvedFaviconAssetId);
      setLogoFile(null);
      setFaviconFile(null);
      toast.success("Ayarlar kaydedildi");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-5">
      <Input label="Şirket Adı" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
      <Input label="Site Başlığı" value={siteTitle} onChange={(event) => setSiteTitle(event.target.value)} />
      <Textarea label="Meta Açıklama" rows={3} value={metaDescription} onChange={(event) => setMetaDescription(event.target.value)} />

      <div className="grid grid-cols-2 gap-4">
        <Select label="Arayüz Fontu" value={uiFont} onChange={(event) => setUiFont(event.target.value)}>
          {AVAILABLE_FONTS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </Select>
        <Select label="Doküman Fontu" value={documentFont} onChange={(event) => setDocumentFont(event.target.value)}>
          {AVAILABLE_FONTS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </Select>
      </div>

      <FileDropInput label="Logo" value={logoFile} onChange={setLogoFile} existingPreviewUrl={resolveAssetUrl(settings.logoUrl)} />
      <FileDropInput label="Favicon" value={faviconFile} onChange={setFaviconFile} existingPreviewUrl={resolveAssetUrl(settings.faviconUrl)} />

      <div className="flex justify-end">
        <Button type="submit" isLoading={updateSettings.isPending || uploadAsset.isPending}>
          Kaydet
        </Button>
      </div>
    </form>
  );
}
