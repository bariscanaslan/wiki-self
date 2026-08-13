import type { GroupSummary } from "./common";

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  groups: GroupSummary[];
  twoFactorEnabled: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  isAdmin: boolean;
}

export interface UpdateUserRequest {
  displayName: string;
  isAdmin: boolean;
}

export interface SetUserActiveRequest {
  isActive: boolean;
}

export interface AssignUserGroupsRequest {
  groupIds: string[];
}

export interface AdminResetPasswordRequest {
  newPassword: string;
}

export interface DeleteUserRequest {
  password: string;
}
