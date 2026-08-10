import type { AuditAction, ResourceType } from "./common";

export interface AuditLogResponse {
  id: string;
  userId: string;
  userDisplayName: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  documentVersionId: string | null;
  timestamp: string;
  details: string | null;
}

export interface AuditLogFilter {
  userId?: string;
  resourceType?: ResourceType;
  resourceId?: string;
  action?: AuditAction;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
