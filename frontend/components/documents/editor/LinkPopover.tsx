"use client";

import type { Editor } from "@tiptap/react";
import { Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../../lib/utils/cn";

export function LinkPopover({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  function openPopover() {
    setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    setIsOpen(true);
  }

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

  function applyLink() {
    if (url.trim()) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : openPopover())}
        title="Bağlantı"
        aria-label="Bağlantı"
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30",
          editor.isActive("link") && "bg-primary-50 text-primary-600",
        )}
      >
        <Link2 size={16} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-2 flex w-64 gap-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
          <input
            autoFocus
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && applyLink()}
            placeholder="https://..."
            className="flex-1 rounded-md border border-zinc-200 px-2 py-1 text-xs focus:border-primary-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={applyLink}
            className="rounded-md bg-primary-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-700"
          >
            Uygula
          </button>
        </div>
      )}
    </div>
  );
}
