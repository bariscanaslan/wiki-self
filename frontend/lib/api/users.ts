import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { queryKeys } from "./queryKeys";
import type {
  AdminResetPasswordRequest,
  AssignUserGroupsRequest,
  CreateUserRequest,
  SetUserActiveRequest,
  UpdateUserRequest,
  UserResponse,
} from "../types";

async function listUsers(): Promise<UserResponse[]> {
  const response = await apiClient.get<UserResponse[]>("/users");
  return response.data;
}

async function createUser(request: CreateUserRequest): Promise<UserResponse> {
  const response = await apiClient.post<UserResponse>("/users", request);
  return response.data;
}

async function updateUser(id: string, request: UpdateUserRequest): Promise<UserResponse> {
  const response = await apiClient.put<UserResponse>(`/users/${id}`, request);
  return response.data;
}

async function setUserActive(id: string, request: SetUserActiveRequest): Promise<void> {
  await apiClient.patch(`/users/${id}/active`, request);
}

async function assignUserGroups(id: string, request: AssignUserGroupsRequest): Promise<UserResponse> {
  const response = await apiClient.put<UserResponse>(`/users/${id}/groups`, request);
  return response.data;
}

async function resetUserPassword(id: string, request: AdminResetPasswordRequest): Promise<void> {
  await apiClient.post(`/users/${id}/reset-password`, request);
}

async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: listUsers });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateUserRequest }) => updateUser(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: SetUserActiveRequest }) => setUserActive(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

export function useAssignUserGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: AssignUserGroupsRequest }) => assignUserGroups(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: AdminResetPasswordRequest }) => resetUserPassword(id, request),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
}
