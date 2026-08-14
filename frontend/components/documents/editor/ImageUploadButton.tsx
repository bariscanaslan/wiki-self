"use client";

import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useRef, type ChangeEvent } from "react";

export function ImageUploadButton({
  onSelect,
  disabled,
  isUploading,
}: {
  onSelect: (file: File) => void;
  disabled?: boolean;
  isUploading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      onSelect(file);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => inputRef.current?.click()}
        title="Görsel Ekle"
        aria-label="Görsel Ekle"
        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
    </>
  );
}
