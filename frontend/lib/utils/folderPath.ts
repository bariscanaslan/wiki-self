import type { FolderTreeNode } from "../types/folders";

export function buildFolderPathMap(tree: FolderTreeNode[]): Map<string, string> {
  const map = new Map<string, string>();

  function walk(nodes: FolderTreeNode[], ancestorNames: string[]) {
    for (const node of nodes) {
      const path = [...ancestorNames, node.name];
      map.set(node.id, path.join("/"));
      walk(node.children, path);
    }
  }

  walk(tree, []);
  return map;
}
