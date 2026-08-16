"use client";

import { ChevronRight, Image as ImageIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDeleteAsset, useImageAssets } from "../../lib/api/assets";
import { extractErrorMessage, resolveAssetUrl } from "../../lib/api/client";
import { canEdit } from "../../lib/auth/permissions";
import { cn } from "../../lib/utils/cn";
import type { ImageAssetResponse } from "../../lib/types";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { Spinner } from "../ui/Spinner";

const PAGE_SIZE = 30;

export function ImageGallerySection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [pendingDelete, setPendingDelete] = useState<ImageAssetResponse | null>(null);
  const { data, isLoading, isFetching } = useImageAssets(limit);
  const deleteAsset = useDeleteAsset();

  const images = data?.items ?? [];
  const hasMore = data ? images.length < data.total : false;

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }

    try {
      await deleteAsset.mutateAsync(pendingDelete.id);
      toast.success("Görsel silindi");
      setPendingDelete(null);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-1 border-t border-zinc-100 dark:border-zinc-800 pt-4">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-2 pb-2 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Görseller</span>
        <ChevronRight size={14} className={cn("text-zinc-400 dark:text-zinc-500 transition-transform", isExpanded && "rotate-90")} />
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-3 px-2">
          {isLoading && (
            <div className="flex justify-center py-4">
              <Spinner className="text-primary-500 dark:text-primary-400" size={16} />
            </div>
          )}

          {!isLoading && images.length === 0 && (
            <EmptyState title="Görsel yok" description="Dokümanlara eklenen görseller burada listelenir." />
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {images.map((image) => (
                <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                  <Link href={`/documents/${image.documentId}`} title={image.documentTitle} className="block h-full w-full">
                    <img
                      src={resolveAssetUrl(image.url) ?? undefined}
                      alt={image.fileName}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 truncate bg-zinc-900/70 px-1.5 py-1 text-[10px] leading-tight text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {image.documentTitle}
                    </div>
                  </Link>
                  {canEdit(image.effectivePermission) && (
                    <button
                      type="button"
                      onClick={() => setPendingDelete(image)}
                      className="absolute right-1 top-1 rounded-full bg-zinc-900/70 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                      aria-label="Görseli sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <button
              type="button"
              onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
              disabled={isFetching}
              className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 px-2 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 transition-colors hover:border-primary-300 dark:hover:border-primary-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-primary-700 dark:hover:text-primary-400 disabled:opacity-50"
            >
              {isFetching ? <Spinner size={14} /> : <ImageIcon size={14} />}
              Daha fazla yükle
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Görseli Sil"
        description={`Bu görseli silmek istediğinize emin misiniz? Dokümanlarda kullanılıyorsa yerine "Görsel silindi" uyarısı gösterilecek.`}
        confirmLabel="Sil"
        isLoading={deleteAsset.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
