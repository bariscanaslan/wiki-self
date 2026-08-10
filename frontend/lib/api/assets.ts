import { useMutation } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { AssetResponse } from "../types";

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
