"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect } from "react";
import { createTiptapExtensions, parseDocumentJson } from "../../lib/tiptap/extensions";

export function DocumentView({ contentJson }: { contentJson: string }) {
  const editor = useEditor({
    extensions: createTiptapExtensions(),
    content: parseDocumentJson(contentJson),
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: "document-content" } },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(parseDocumentJson(contentJson));
    }
  }, [editor, contentJson]);

  return <EditorContent editor={editor} />;
}
