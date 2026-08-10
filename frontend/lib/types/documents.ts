import type { AssetResponse, TagResponse } from "./common";
import type { PermissionLevel } from "./common";

export interface DocumentResponse {
  id: string;
  title: string;
  folderId: string;
  categoryId: string | null;
  contentJson: string;
  contentMarkdown: string;
  versionNumber: number;
  tags: TagResponse[];
  createdAt: string;
  createdByUserId: string;
  createdByDisplayName: string;
  updatedAt: string;
  effectivePermission: PermissionLevel;
}

export interface CreateDocumentRequest {
  title: string;
  folderId: string;
  contentJson: string;
  contentMarkdown: string;
  categoryId?: string | null;
  tagIds?: string[] | null;
}

export interface SaveDocumentRequest {
  title: string;
  contentJson: string;
  contentMarkdown: string;
}

export interface MoveDocumentRequest {
  folderId: string;
}

export interface AssignDocumentTagsRequest {
  tagIds: string[];
}

export interface AssignDocumentCategoryRequest {
  categoryId?: string | null;
}

export interface DocumentVersionResponse {
  id: string;
  versionNumber: number;
  createdAt: string;
  authorUserId: string;
  authorDisplayName: string;
}

export interface DocumentVersionDetailResponse extends DocumentVersionResponse {
  contentJson: string;
  contentMarkdown: string;
}

export interface ExportContentResponse {
  documentId: string;
  title: string;
  contentJson: string;
  contentMarkdown: string;
  documentFont: string;
  assets: AssetResponse[];
}

export interface LogExportRequest {
  format?: string | null;
}
