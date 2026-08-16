"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "../../lib/api/client";
import { useAssignDocumentTags } from "../../lib/api/documents";
import { useCreateTag, useTags } from "../../lib/api/tags";
import type { TagResponse } from "../../lib/types";
import { Badge } from "../ui/Badge";

interface TagPickerProps {
  documentId: string;
  tags: TagResponse[];
  editable: boolean;
}

export function TagPicker({ documentId, tags, editable }: TagPickerProps) {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: allTags } = useTags();
  const createTag = useCreateTag();
  const assignTags = useAssignDocumentTags();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const currentIds = tags.map((tag) => tag.id);

  const suggestions = (allTags ?? []).filter(
    (tag) => !currentIds.includes(tag.id) && tag.name.toLowerCase().includes(input.trim().toLowerCase()),
  );

  async function persist(nextIds: string[]) {
    try {
      await assignTags.mutateAsync({ id: documentId, request: { tagIds: nextIds } });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  async function addTag(tag: TagResponse) {
    setInput("");
    setIsOpen(false);
    await persist([...currentIds, tag.id]);
  }

  async function removeTag(tagId: string) {
    await persist(currentIds.filter((id) => id !== tagId));
  }

  async function createAndAdd() {
    const name = input.trim();
    if (!name) {
      return;
    }

    try {
      const tag = await createTag.mutateAsync({ name });
      await addTag(tag);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag.id} variant="primary" className="gap-1">
          {tag.name}
          {editable && (
            <button type="button" onClick={() => removeTag(tag.id)} className="rounded-full hover:bg-primary-100 dark:hover:bg-primary-500/15" aria-label={`${tag.name} etiketini kaldır`}>
              <X size={10} />
            </button>
          )}
        </Badge>
      ))}

      {editable && (
        <div ref={containerRef} className="relative">
          <input
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && input.trim()) {
                event.preventDefault();
                const exact = suggestions.find((suggestion) => suggestion.name.toLowerCase() === input.trim().toLowerCase());
                if (exact) {
                  addTag(exact);
                } else {
                  createAndAdd();
                }
              }
            }}
            placeholder="Etiket ekle..."
            className="w-28 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 px-2.5 py-0.5 text-xs focus:border-primary-400 focus:outline-none"
          />
          {isOpen && input.trim() && (
            <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-40 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-lg">
              {suggestions.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="block w-full rounded px-2 py-1 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {tag.name}
                </button>
              ))}
              <button
                type="button"
                onClick={createAndAdd}
                className="block w-full rounded px-2 py-1 text-left text-xs text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10"
              >
                &quot;{input.trim()}&quot; oluştur
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
