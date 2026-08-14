"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage, resolveAssetUrl } from "../../../lib/api/client";
import { useUploadAsset } from "../../../lib/api/assets";
import { createTiptapExtensions, getMarkdownContent, parseDocumentJson } from "../../../lib/tiptap/extensions";
import { EditorToolbar } from "./EditorToolbar";

const MARKDOWN_PREVIEW_DEBOUNCE_MS = 200;

export interface DocumentEditorHandle {
  getContent: () => { contentJson: string; contentMarkdown: string };
}

interface DocumentEditorProps {
  documentId: string;
  initialContentJson: string;
}

export const DocumentEditor = forwardRef<DocumentEditorHandle, DocumentEditorProps>(({ documentId, initialContentJson }, ref) => {
  const [mode, setMode] = useState<"wysiwyg" | "markdown">("markdown");
  const [markdownDraft, setMarkdownDraft] = useState("");
  const hasSeededDraft = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uploadAsset = useUploadAsset();

  const editor = useEditor({
    extensions: createTiptapExtensions("Doküman içeriğini yazmaya başlayın..."),
    content: parseDocumentJson(initialContentJson),
    immediatelyRender: false,
    editorProps: { attributes: { class: "document-content tiptap-editor" } },
  });

  const previewEditor = useEditor({
    extensions: createTiptapExtensions(),
    content: parseDocumentJson(initialContentJson),
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: "document-content" } },
  });

  useEffect(() => {
    if (editor && !hasSeededDraft.current) {
      hasSeededDraft.current = true;
      setMarkdownDraft(getMarkdownContent(editor));
    }
  }, [editor]);

  useEffect(() => {
    if (!previewEditor || previewEditor.isDestroyed || mode !== "markdown") {
      return;
    }

    const timeoutId = setTimeout(() => {
      previewEditor.commands.setContent(markdownDraft);
    }, MARKDOWN_PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [previewEditor, markdownDraft, mode]);

  useImperativeHandle(
    ref,
    () => ({
      getContent: () => {
        if (!editor) {
          return { contentJson: initialContentJson, contentMarkdown: "" };
        }

        if (mode === "markdown") {
          editor.commands.setContent(markdownDraft);
        }

        return {
          contentJson: JSON.stringify(editor.getJSON()),
          contentMarkdown: getMarkdownContent(editor),
        };
      },
    }),
    [editor, mode, markdownDraft, initialContentJson],
  );

  function insertMarkdownAtCursor(snippet: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMarkdownDraft((prev) => prev + snippet);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const cursorPos = start + snippet.length;

    setMarkdownDraft((prev) => `${prev.slice(0, start)}${snippet}${prev.slice(end)}`);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  }

  async function uploadAndInsertImage(file: File) {
    try {
      const asset = await uploadAsset.mutateAsync({ file, documentId });
      const url = resolveAssetUrl(asset.url);
      if (!url) {
        return;
      }

      if (mode === "wysiwyg") {
        editor?.chain().focus().setImage({ src: url, alt: asset.fileName }).run();
      } else {
        insertMarkdownAtCursor(`![${asset.fileName}](${url})`);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  function handleTextareaPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const imageFile = Array.from(event.clipboardData.items)
      .find((item) => item.type.startsWith("image/"))
      ?.getAsFile();

    if (imageFile) {
      event.preventDefault();
      uploadAndInsertImage(imageFile);
    }
  }

  function handleTextareaDragOver(event: React.DragEvent<HTMLTextAreaElement>) {
    if (Array.from(event.dataTransfer.items).some((item) => item.kind === "file")) {
      event.preventDefault();
    }
  }

  function handleTextareaDrop(event: React.DragEvent<HTMLTextAreaElement>) {
    const imageFile = Array.from(event.dataTransfer.files).find((file) => file.type.startsWith("image/"));
    if (imageFile) {
      event.preventDefault();
      uploadAndInsertImage(imageFile);
    }
  }

  function toggleMode() {
    if (!editor) {
      return;
    }

    if (mode === "wysiwyg") {
      setMarkdownDraft(getMarkdownContent(editor));
      setMode("markdown");
    } else {
      editor.commands.setContent(markdownDraft);
      setMode("wysiwyg");
    }
  }

  if (!editor) {
    return null;
  }

  return (
    <div>
      <EditorToolbar
        editor={editor}
        mode={mode}
        onToggleMode={toggleMode}
        onImageSelect={uploadAndInsertImage}
        isUploadingImage={uploadAsset.isPending}
      />
      <div className="rounded-b-xl border border-zinc-200 bg-white px-4 py-4">
        {mode === "wysiwyg" ? (
          <EditorContent editor={editor} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <textarea
              ref={textareaRef}
              autoFocus
              value={markdownDraft}
              onChange={(event) => setMarkdownDraft(event.target.value)}
              onPaste={handleTextareaPaste}
              onDragOver={handleTextareaDragOver}
              onDrop={handleTextareaDrop}
              className="min-h-[320px] w-full resize-y rounded-lg border border-zinc-100 bg-zinc-50 p-3 font-mono text-sm text-zinc-800 outline-none"
              placeholder="Markdown içeriği... (görsel yapıştırabilir veya sürükleyip bırakabilirsiniz)"
            />
            <div className="min-h-[320px] overflow-y-auto rounded-lg border border-zinc-100 p-3">
              <EditorContent editor={previewEditor} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

DocumentEditor.displayName = "DocumentEditor";
