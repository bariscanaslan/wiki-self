import type { PermissionLevel } from "./common";

export interface DocumentSummary {
  id: string;
  title: string;
  folderId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderResponse {
  id: string;
  name: string;
  parentId: string | null;
  materializedPath: string;
  createdAt: string;
  effectivePermission: PermissionLevel | null;
}

export interface FolderTreeNode {
  id: string;
  name: string;
  parentId: string | null;
  materializedPath: string;
  createdAt: string;
  effectivePermission: PermissionLevel | null;
  children: FolderTreeNode[];
  documents: DocumentSummary[];
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
}

export interface RenameFolderRequest {
  name: string;
}

export interface MoveFolderRequest {
  newParentId?: string | null;
}
