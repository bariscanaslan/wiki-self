import type { UserSummary } from "./common";

export interface GroupResponse {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
}

export interface GroupDetailResponse {
  id: string;
  name: string;
  description: string | null;
  members: UserSummary[];
}

export interface CreateGroupRequest {
  name: string;
  description?: string | null;
}

export interface UpdateGroupRequest {
  name: string;
  description?: string | null;
}

export interface UpdateGroupMembersRequest {
  userIds: string[];
}
