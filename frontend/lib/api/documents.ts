import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { queryKeys } from "./queryKeys";
import type {
  AssignDocumentCategoryRequest,
  AssignDocumentTagsRequest,
  CreateDocumentRequest,
  DocumentResponse,
  DocumentVersionDetailResponse,
  DocumentVersionResponse,
  ExportContentResponse,
  LogExportRequest,
  MoveDocumentRequest,
  SaveDocumentRequest,
} from "../types";

async function getDocument(id: string): Promise<DocumentResponse> {
  const response = await apiClient.get<DocumentResponse>(`/documents/${id}`);
  return response.data;
}

async function createDocument(request: CreateDocumentRequest): Promise<DocumentResponse> {
  const response = await apiClient.post<DocumentResponse>("/documents", request);
  return response.data;
}

async function saveDocument(id: string, request: SaveDocumentRequest): Promise<DocumentResponse> {
  const response = await apiClient.put<DocumentResponse>(`/documents/${id}`, request);
  return response.data;
}

async function getVersionHistory(id: string): Promise<DocumentVersionResponse[]> {
  const response = await apiClient.get<DocumentVersionResponse[]>(`/documents/${id}/versions`);
  return response.data;
}

async function getVersion(id: string, versionId: string): Promise<DocumentVersionDetailResponse> {
  const response = await apiClient.get<DocumentVersionDetailResponse>(`/documents/${id}/versions/${versionId}`);
  return response.data;
}

async function restoreVersion(id: string, versionId: string): Promise<DocumentResponse> {
  const response = await apiClient.post<DocumentResponse>(`/documents/${id}/versions/${versionId}/restore`);
  return response.data;
}

async function assignTags(id: string, request: AssignDocumentTagsRequest): Promise<DocumentResponse> {
  const response = await apiClient.put<DocumentResponse>(`/documents/${id}/tags`, request);
  return response.data;
}

async function assignCategory(id: string, request: AssignDocumentCategoryRequest): Promise<DocumentResponse> {
  const response = await apiClient.put<DocumentResponse>(`/documents/${id}/category`, request);
  return response.data;
}

async function moveDocument(id: string, request: MoveDocumentRequest): Promise<DocumentResponse> {
  const response = await apiClient.put<DocumentResponse>(`/documents/${id}/move`, request);
  return response.data;
}

async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}`);
}

async function getExportContent(id: string): Promise<ExportContentResponse> {
  const response = await apiClient.get<ExportContentResponse>(`/documents/${id}/export-content`);
  return response.data;
}

async function logExport(id: string, request: LogExportRequest): Promise<void> {
  await apiClient.post(`/documents/${id}/log-export`, request);
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.document(id ?? ""),
    queryFn: () => getDocument(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.folderTree }),
  });
}

export function useSaveDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: SaveDocumentRequest }) => saveDocument(id, request),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.document(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.documentVersions(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.folderTree });
    },
  });
}

export function useDocumentVersions(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.documentVersions(id ?? ""),
    queryFn: () => getVersionHistory(id as string),
    enabled: Boolean(id),
  });
}

export function useDocumentVersion(id: string | undefined, versionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.documentVersion(id ?? "", versionId ?? ""),
    queryFn: () => getVersion(id as string, versionId as string),
    enabled: Boolean(id) && Boolean(versionId),
  });
}

export function useRestoreVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, versionId }: { id: string; versionId: string }) => restoreVersion(id, versionId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.document(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.documentVersions(data.id) });
    },
  });
}

export function useAssignDocumentTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: AssignDocumentTagsRequest }) => assignTags(id, request),
    onSuccess: (data) => queryClient.setQueryData(queryKeys.document(data.id), data),
  });
}

export function useAssignDocumentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: AssignDocumentCategoryRequest }) => assignCategory(id, request),
    onSuccess: (data) => queryClient.setQueryData(queryKeys.document(data.id), data),
  });
}

export function useMoveDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: MoveDocumentRequest }) => moveDocument(id, request),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.document(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.folderTree });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.folderTree }),
  });
}

export function useExportContent(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.documentExport(id ?? ""),
    queryFn: () => getExportContent(id as string),
    enabled: false,
  });
}

export function useLogExport() {
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: LogExportRequest }) => logExport(id, request),
  });
}

export { getExportContent };
