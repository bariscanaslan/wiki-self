"use client";

import type { ChangeEvent } from "react";
import toast from "react-hot-toast";
import { useCategories } from "../../lib/api/categories";
import { extractErrorMessage } from "../../lib/api/client";
import { useAssignDocumentCategory } from "../../lib/api/documents";

interface CategorySelectProps {
  documentId: string;
  categoryId: string | null;
  editable: boolean;
}

export function CategorySelect({ documentId, categoryId, editable }: CategorySelectProps) {
  const { data: categories } = useCategories();
  const assignCategory = useAssignDocumentCategory();

  const currentName = categories?.find((category) => category.id === categoryId)?.name;

  if (!editable) {
    return categoryId ? <span className="text-xs font-medium text-zinc-500">Kategori: {currentName ?? "—"}</span> : null;
  }

  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value || null;
    try {
      await assignCategory.mutateAsync({ id: documentId, request: { categoryId: value } });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <select
      value={categoryId ?? ""}
      onChange={handleChange}
      className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600 focus:border-primary-400 focus:outline-none"
    >
      <option value="">Kategori yok</option>
      {categories?.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
