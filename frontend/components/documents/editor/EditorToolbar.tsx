"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Pencil,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../../lib/utils/cn";
import { ImageUploadButton } from "./ImageUploadButton";
import { LinkPopover } from "./LinkPopover";

interface EditorToolbarProps {
  editor: Editor;
  mode: "wysiwyg" | "markdown";
  onToggleMode: () => void;
  onImageSelect: (file: File) => void;
  isUploadingImage?: boolean;
}

function ToolbarButton({
  isActive,
  onClick,
  disabled,
  children,
  label,
}: {
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30",
        isActive && "bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400",
      )}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({ editor, mode, onToggleMode, onImageSelect, isUploadingImage }: EditorToolbarProps) {
  const isMarkdownMode = mode === "markdown";

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-xl border border-b-0 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 p-2">
      <ToolbarButton label="Kalın" isActive={editor.isActive("bold")} disabled={isMarkdownMode} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton label="İtalik" isActive={editor.isActive("italic")} disabled={isMarkdownMode} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Üstü Çizili"
        isActive={editor.isActive("strike")}
        disabled={isMarkdownMode}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={16} />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      <ToolbarButton
        label="Başlık 1"
        isActive={editor.isActive("heading", { level: 1 })}
        disabled={isMarkdownMode}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Başlık 2"
        isActive={editor.isActive("heading", { level: 2 })}
        disabled={isMarkdownMode}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Başlık 3"
        isActive={editor.isActive("heading", { level: 3 })}
        disabled={isMarkdownMode}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={16} />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      <ToolbarButton
        label="Madde Listesi"
        isActive={editor.isActive("bulletList")}
        disabled={isMarkdownMode}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Numaralı Liste"
        isActive={editor.isActive("orderedList")}
        disabled={isMarkdownMode}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Alıntı"
        isActive={editor.isActive("blockquote")}
        disabled={isMarkdownMode}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Kod Bloğu"
        isActive={editor.isActive("codeBlock")}
        disabled={isMarkdownMode}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 size={16} />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      <LinkPopover editor={editor} disabled={isMarkdownMode} />
      <ImageUploadButton onSelect={onImageSelect} isUploading={isUploadingImage} />

      <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      <ToolbarButton label="Geri Al" disabled={isMarkdownMode} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 size={16} />
      </ToolbarButton>
      <ToolbarButton label="Yinele" disabled={isMarkdownMode} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 size={16} />
      </ToolbarButton>

      <div className="ml-auto">
        <button
          type="button"
          onClick={onToggleMode}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 transition-colors hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400"
        >
          {isMarkdownMode ? <Eye size={14} /> : <Pencil size={14} />}
          {isMarkdownMode ? "Zengin Metin" : "Markdown"}
        </button>
      </div>
    </div>
  );
}
