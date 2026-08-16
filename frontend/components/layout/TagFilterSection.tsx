"use client";

import { ChevronRight, Tag as TagIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDeleteTag, useTags } from "../../lib/api/tags";
import { extractErrorMessage } from "../../lib/api/client";
import { useAuth } from "../../lib/auth/AuthContext";
import { cn } from "../../lib/utils/cn";
import type { TagResponse } from "../../lib/types";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { Spinner } from "../ui/Spinner";

export function TagFilterSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TagResponse | null>(null);
  const { data: tags, isLoading } = useTags();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTagId = pathname === "/search" ? searchParams.get("tagId") : null;
  const deleteTag = useDeleteTag();

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }

    try {
      await deleteTag.mutateAsync(pendingDelete.id);
      toast.success("Etiket silindi");
      if (activeTagId === pendingDelete.id) {
        router.push("/search");
      }
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
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Etiketler</span>
        <ChevronRight size={14} className={cn("text-zinc-400 dark:text-zinc-500 transition-transform", isExpanded && "rotate-90")} />
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-1">
          {isLoading && (
            <div className="flex justify-center py-4">
              <Spinner className="text-primary-500 dark:text-primary-400" size={16} />
            </div>
          )}

          {!isLoading && (!tags || tags.length === 0) && (
            <EmptyState title="Etiket yok" description="Dokümanlara eklenen etiketler burada listelenir." />
          )}

          {tags?.map((tag) => {
            const isActive = tag.id === activeTagId;
            return (
              <div
                key={tag.id}
                className={cn(
                  "group flex items-center gap-1 rounded-lg pr-1 text-sm transition-colors",
                  isActive ? "bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                )}
              >
                <Link href={`/search?tagId=${tag.id}`} className="flex flex-1 items-center gap-2 truncate px-2 py-1.5">
                  <TagIcon size={14} className={cn("shrink-0", isActive ? "text-primary-500 dark:text-primary-400" : "text-zinc-400 dark:text-zinc-500")} />
                  <span className="truncate">{tag.name}</span>
                </Link>
                {user?.isAdmin && (
                  <button
                    type="button"
                    onClick={() => setPendingDelete(tag)}
                    className="rounded p-1 text-zinc-400 dark:text-zinc-500 opacity-0 transition-opacity hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 group-hover:opacity-100"
                    aria-label="Etiketi sil"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Etiketi Sil"
        description={`"${pendingDelete?.name ?? ""}" etiketini silmek istediğinize emin misiniz? Etiket, kullanıldığı tüm dokümanlardan güvenli şekilde kaldırılacak.`}
        confirmLabel="Sil"
        isLoading={deleteTag.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
