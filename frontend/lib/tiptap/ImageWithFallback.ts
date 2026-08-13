import { mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";

// The stock Image node renders a plain <img> via toDOM, so a broken source (e.g. a
// deleted asset) just shows the browser's broken-image icon. ProseMirror owns that DOM
// subtree directly, so a React onError prop can't reach it — a custom NodeView is the
// only way to intercept the load failure and swap in a placeholder.
export const ImageWithFallback = Image.extend({
  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const wrapper = document.createElement("span");
      wrapper.className = "inline-block max-w-full align-top";
      wrapper.draggable = true;

      const renderPlaceholder = () => {
        wrapper.replaceChildren();
        const placeholder = document.createElement("div");
        placeholder.className =
          "flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm text-zinc-400";
        placeholder.textContent = "Görsel silindi";
        wrapper.appendChild(placeholder);
      };

      const renderImage = (src: unknown) => {
        wrapper.replaceChildren();

        if (typeof src !== "string" || src === "") {
          renderPlaceholder();
          return;
        }

        const img = document.createElement("img");
        const merged = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
        Object.entries(merged).forEach(([key, value]) => {
          if (value != null && key !== "src") {
            img.setAttribute(key, String(value));
          }
        });
        img.src = src;
        img.addEventListener("error", renderPlaceholder, { once: true });
        wrapper.appendChild(img);
      };

      renderImage(node.attrs.src);

      return {
        dom: wrapper,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) {
            return false;
          }
          renderImage(updatedNode.attrs.src);
          return true;
        },
      };
    };
  },
});
