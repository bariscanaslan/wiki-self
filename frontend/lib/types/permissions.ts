import type { PermissionLevel, ResourceType } from "./common";

export interface PermissionResponse {
  id: string;
  groupId: string;
  groupName: string;
  resourceType: ResourceType;
  resourceId: string;
  level: PermissionLevel;
}

export interface AssignPermissionRequest {
  groupId: string;
  resourceType: ResourceType;
  resourceId: string;
  level: PermissionLevel;
}

export interface EffectivePermissionResponse {
  resourceType: ResourceType;
  resourceId: string;
  level: PermissionLevel | null;
}
