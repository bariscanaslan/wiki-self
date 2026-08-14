import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import type { AnyExtension, Editor } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { Markdown } from "tiptap-markdown";
import { CodeBlockComponent } from "../../components/documents/editor/CodeBlockComponent";
import { ImageWithFallback } from "./ImageWithFallback";

const lowlight = createLowlight(common);

const CodeBlockWithCopy = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
});

export function createTiptapExtensions(placeholderText?: string): AnyExtension[] {
  return [
    StarterKit.configure({ codeBlock: false, link: false }),
    CodeBlockWithCopy.configure({ lowlight }),
    ImageWithFallback.configure({ HTMLAttributes: { class: "rounded-lg" } }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
    }),
    Placeholder.configure({ placeholder: placeholderText ?? "Yazmaya başlayın..." }),
    Markdown.configure({ html: false, tightLists: true, linkify: true, breaks: false, transformPastedText: true }),
  ];
}

export function parseDocumentJson(contentJson: string): Record<string, unknown> {
  try {
    return contentJson ? JSON.parse(contentJson) : { type: "doc", content: [{ type: "paragraph" }] };
  } catch {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
}

export function getMarkdownContent(editor: Editor): string {
  return (editor.storage as unknown as { markdown: { getMarkdown(): string } }).markdown.getMarkdown();
}
