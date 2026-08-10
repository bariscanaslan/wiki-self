import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { queryKeys } from "./queryKeys";
import type { CreateTagRequest, TagResponse, UpdateTagRequest } from "../types";

async function listTags(): Promise<TagResponse[]> {
  const response = await apiClient.get<TagResponse[]>("/tags");
  return response.data;
}

async function createTag(request: CreateTagRequest): Promise<TagResponse> {
  const response = await apiClient.post<TagResponse>("/tags", request);
  return response.data;
}

async function updateTag(id: string, request: UpdateTagRequest): Promise<TagResponse> {
  const response = await apiClient.put<TagResponse>(`/tags/${id}`, request);
  return response.data;
}

async function deleteTag(id: string): Promise<void> {
  await apiClient.delete(`/tags/${id}`);
}

export function useTags() {
  return useQuery({ queryKey: queryKeys.tags, queryFn: listTags });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tags }),
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateTagRequest }) => updateTag(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tags }),
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tags }),
  });
}
