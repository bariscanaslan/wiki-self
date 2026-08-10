import { PermissionLevel } from "../types";

export function canView(level: PermissionLevel | null | undefined): boolean {
  return level !== null && level !== undefined && level >= PermissionLevel.View;
}

export function canEdit(level: PermissionLevel | null | undefined): boolean {
  return level !== null && level !== undefined && level >= PermissionLevel.Edit;
}

export function canManage(level: PermissionLevel | null | undefined): boolean {
  return level !== null && level !== undefined && level >= PermissionLevel.Manage;
}
