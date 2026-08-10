import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { queryKeys } from "./queryKeys";
import type {
  CreateGroupRequest,
  GroupDetailResponse,
  GroupResponse,
  UpdateGroupMembersRequest,
  UpdateGroupRequest,
} from "../types";

async function listGroups(): Promise<GroupResponse[]> {
  const response = await apiClient.get<GroupResponse[]>("/groups");
  return response.data;
}

async function getGroup(id: string): Promise<GroupDetailResponse> {
  const response = await apiClient.get<GroupDetailResponse>(`/groups/${id}`);
  return response.data;
}

async function createGroup(request: CreateGroupRequest): Promise<GroupResponse> {
  const response = await apiClient.post<GroupResponse>("/groups", request);
  return response.data;
}

async function updateGroup(id: string, request: UpdateGroupRequest): Promise<GroupResponse> {
  const response = await apiClient.put<GroupResponse>(`/groups/${id}`, request);
  return response.data;
}

async function updateGroupMembers(id: string, request: UpdateGroupMembersRequest): Promise<GroupDetailResponse> {
  const response = await apiClient.put<GroupDetailResponse>(`/groups/${id}/members`, request);
  return response.data;
}

async function deleteGroup(id: string): Promise<void> {
  await apiClient.delete(`/groups/${id}`);
}

export function useGroups() {
  return useQuery({ queryKey: queryKeys.groups, queryFn: listGroups });
}

export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.group(id ?? ""),
    queryFn: () => getGroup(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateGroupRequest }) => updateGroup(id, request),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      queryClient.invalidateQueries({ queryKey: queryKeys.group(variables.id) });
    },
  });
}

export function useUpdateGroupMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateGroupMembersRequest }) => updateGroupMembers(id, request),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      queryClient.invalidateQueries({ queryKey: queryKeys.group(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
  });
}
