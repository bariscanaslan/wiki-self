"use client";

import type { Editor } from "@tiptap/react";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage, resolveAssetUrl } from "../../../lib/api/client";
import { useUploadAsset } from "../../../lib/api/assets";

export function ImageUploadButton({ editor, documentId, disabled }: { editor: Editor; documentId: string; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadAsset = useUploadAsset();

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      const asset = await uploadAsset.mutateAsync({ file, documentId });
      const url = resolveAssetUrl(asset.url);
      if (url) {
        editor.chain().focus().setImage({ src: url, alt: asset.fileName }).run();
      }
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled || uploadAsset.isPending}
        onClick={() => inputRef.current?.click()}
        title="Görsel Ekle"
        aria-label="Görsel Ekle"
        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {uploadAsset.isPending ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
    </>
  );
}
