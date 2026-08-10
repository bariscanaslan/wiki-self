import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { queryKeys } from "./queryKeys";
import type { AssignPermissionRequest, PermissionResponse, ResourceType } from "../types";

async function getPermissionsForResource(resourceType: ResourceType, resourceId: string): Promise<PermissionResponse[]> {
  const response = await apiClient.get<PermissionResponse[]>("/permissions", {
    params: { resourceType, resourceId },
  });
  return response.data;
}

async function assignPermission(request: AssignPermissionRequest): Promise<PermissionResponse> {
  const response = await apiClient.post<PermissionResponse>("/permissions", request);
  return response.data;
}

async function removePermission(id: string): Promise<void> {
  await apiClient.delete(`/permissions/${id}`);
}

export function usePermissionsForResource(resourceType: ResourceType, resourceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.permissions(resourceType, resourceId ?? ""),
    queryFn: () => getPermissionsForResource(resourceType, resourceId as string),
    enabled: Boolean(resourceId),
  });
}

export function useAssignPermission(resourceType: ResourceType, resourceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions(resourceType, resourceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.folderTree });
    },
  });
}

export function useRemovePermission(resourceType: ResourceType, resourceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions(resourceType, resourceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.folderTree });
    },
  });
}
