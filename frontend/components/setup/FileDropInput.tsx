"use client";

import { Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils/cn";

interface FileDropInputProps {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  existingPreviewUrl?: string | null;
}

export function FileDropInput({ label, value, onChange, accept = "image/*", existingPreviewUrl }: FileDropInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const objectUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const previewUrl = objectUrl ?? existingPreviewUrl ?? null;

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) {
      onChange(file);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
          isDragging ? "border-primary-500 bg-primary-50" : "border-zinc-200 hover:border-primary-300 hover:bg-zinc-50",
        )}
      >
        {previewUrl ? (
          <div className="relative">
            <img src={previewUrl} alt={label} className="h-16 w-16 rounded-lg object-cover" />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
              }}
              className="absolute -right-2 -top-2 rounded-full bg-zinc-900 p-1 text-white"
              aria-label="Kaldır"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={20} className="text-zinc-400" />
            <p className="text-xs text-zinc-500">Yüklemek için tıklayın veya dosyayı sürükleyin</p>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} hidden onChange={(event) => handleFiles(event.target.files)} />
    </div>
  );
}
