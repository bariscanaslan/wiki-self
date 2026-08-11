"use client";

import { Tag } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCategories } from "../../lib/api/categories";
import { cn } from "../../lib/utils/cn";
import { Spinner } from "../ui/Spinner";

export function CategoryFilterList() {
  const { data: categories, isLoading } = useCategories();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategoryId = pathname === "/search" ? searchParams.get("categoryId") : null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner className="text-primary-500" size={16} />
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-1 border-t border-zinc-100 pt-4">
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Kategoriler</span>
      </div>

      {categories.map((category) => {
        const isActive = category.id === activeCategoryId;
        return (
          <Link
            key={category.id}
            href={`/search?categoryId=${category.id}`}
            className={cn(
              "flex items-center gap-2 truncate rounded-lg px-2 py-1.5 text-sm transition-colors",
              isActive ? "bg-primary-50 text-primary-700" : "text-zinc-700 hover:bg-zinc-100",
            )}
          >
            <Tag size={14} className={cn("shrink-0", isActive ? "text-primary-500" : "text-zinc-400")} />
            <span className="truncate">{category.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
