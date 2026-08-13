import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { queryKeys } from "./queryKeys";
import type { AssetResponse, ImageAssetListResponse } from "../types";

export async function uploadAsset(file: File, documentId?: string | null): Promise<AssetResponse> {
  const formData = new FormData();
  formData.append("File", file);
  if (documentId) {
    formData.append("DocumentId", documentId);
  }

  const response = await apiClient.post<AssetResponse>("/assets/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export function useUploadAsset() {
  return useMutation({
    mutationFn: ({ file, documentId }: { file: File; documentId?: string | null }) => uploadAsset(file, documentId),
  });
}

async function getImageAssets(page: number, pageSize: number): Promise<ImageAssetListResponse> {
  const response = await apiClient.get<ImageAssetListResponse>("/assets/images", { params: { page, pageSize } });
  return response.data;
}

export function useImageAssets(limit = 30) {
  return useQuery({
    queryKey: queryKeys.images(limit),
    queryFn: () => getImageAssets(1, limit),
    placeholderData: (previous) => previous,
  });
}

async function deleteAsset(id: string): Promise<void> {
  await apiClient.delete(`/assets/${id}`);
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets", "images"] }),
  });
}
