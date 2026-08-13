import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { queryKeys } from "./queryKeys";
import type {
  CreateFolderRequest,
  FolderResponse,
  FolderTreeNode,
  MoveFolderRequest,
  RenameFolderRequest,
  UpdateFolderIconRequest,
} from "../types";

async function getTree(): Promise<FolderTreeNode[]> {
  const response = await apiClient.get<FolderTreeNode[]>("/folders/tree");
  return response.data;
}

async function createFolder(request: CreateFolderRequest): Promise<FolderResponse> {
  const response = await apiClient.post<FolderResponse>("/folders", request);
  return response.data;
}

async function renameFolder(id: string, request: RenameFolderRequest): Promise<FolderResponse> {
  const response = await apiClient.put<FolderResponse>(`/folders/${id}/rename`, request);
  return response.data;
}

async function moveFolder(id: string, request: MoveFolderRequest): Promise<FolderResponse> {
  const response = await apiClient.put<FolderResponse>(`/folders/${id}/move`, request);
  return response.data;
}

async function deleteFolder(id: string): Promise<void> {
  await apiClient.delete(`/folders/${id}`);
}

async function updateFolderIcon(id: string, request: UpdateFolderIconRequest): Promise<FolderResponse> {
  const response = await apiClient.put<FolderResponse>(`/folders/${id}/icon`, request);
  return response.data;
}

export function useFolderTree() {
  return useQuery({ queryKey: queryKeys.folderTree, queryFn: getTree });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFolder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.folderTree }),
  });
}

export function useRenameFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: RenameFolderRequest }) => renameFolder(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.folderTree }),
  });
}

export function useMoveFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: MoveFolderRequest }) => moveFolder(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.folderTree }),
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.folderTree }),
  });
}

export function useUpdateFolderIcon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateFolderIconRequest }) => updateFolderIcon(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.folderTree }),
  });
}
