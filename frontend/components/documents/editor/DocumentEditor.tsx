"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { createTiptapExtensions, getMarkdownContent, parseDocumentJson } from "../../../lib/tiptap/extensions";
import { EditorToolbar } from "./EditorToolbar";

export interface DocumentEditorHandle {
  getContent: () => { contentJson: string; contentMarkdown: string };
}

interface DocumentEditorProps {
  documentId: string;
  initialContentJson: string;
}

export const DocumentEditor = forwardRef<DocumentEditorHandle, DocumentEditorProps>(({ documentId, initialContentJson }, ref) => {
  const [mode, setMode] = useState<"wysiwyg" | "markdown">("wysiwyg");
  const [markdownDraft, setMarkdownDraft] = useState("");

  const editor = useEditor({
    extensions: createTiptapExtensions("Doküman içeriğini yazmaya başlayın..."),
    content: parseDocumentJson(initialContentJson),
    immediatelyRender: false,
    editorProps: { attributes: { class: "document-content tiptap-editor" } },
  });

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
      <EditorToolbar editor={editor} documentId={documentId} mode={mode} onToggleMode={toggleMode} />
      <div className="rounded-b-xl border border-zinc-200 bg-white px-4 py-4">
        {mode === "wysiwyg" ? (
          <EditorContent editor={editor} />
        ) : (
          <textarea
            autoFocus
            value={markdownDraft}
            onChange={(event) => setMarkdownDraft(event.target.value)}
            className="min-h-[320px] w-full resize-y font-mono text-sm text-zinc-800 outline-none"
            placeholder="Markdown içeriği..."
          />
        )}
      </div>
    </div>
  );
});

DocumentEditor.displayName = "DocumentEditor";
