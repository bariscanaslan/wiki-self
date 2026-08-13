export enum PermissionLevel {
  View = 0,
  Edit = 1,
  Manage = 2,
}

export enum ResourceType {
  Folder = 0,
  Document = 1,
}

export enum AuditAction {
  Create = 0,
  Update = 1,
  Delete = 2,
  View = 3,
  Export = 4,
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
}

export interface GroupSummary {
  id: string;
  name: string;
}

export interface TagResponse {
  id: string;
  name: string;
}

export interface AssetResponse {
  id: string;
  fileName: string;
  contentType: string;
  createdAt: string;
  url: string;
  documentId: string | null;
}

export interface ImageAssetResponse {
  id: string;
  fileName: string;
  url: string;
  createdAt: string;
  documentId: string;
  documentTitle: string;
  effectivePermission: PermissionLevel | null;
}

export interface ImageAssetListResponse {
  items: ImageAssetResponse[];
  total: number;
  page: number;
  pageSize: number;
}
