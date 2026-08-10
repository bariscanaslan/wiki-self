import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { queryKeys } from "./queryKeys";
import type { SetupInitializeResponse, SetupStatusResponse } from "../types";

export interface SetupInitializePayload {
  adminEmail: string;
  adminPassword: string;
  adminDisplayName: string;
  companyName: string;
  siteTitle: string;
  metaDescription?: string;
  logo?: File | null;
  favicon?: File | null;
}

async function getStatus(): Promise<SetupStatusResponse> {
  const response = await apiClient.get<SetupStatusResponse>("/setup/status");
  return response.data;
}

async function initialize(payload: SetupInitializePayload): Promise<SetupInitializeResponse> {
  const formData = new FormData();
  formData.append("AdminEmail", payload.adminEmail);
  formData.append("AdminPassword", payload.adminPassword);
  formData.append("AdminDisplayName", payload.adminDisplayName);
  formData.append("CompanyName", payload.companyName);
  formData.append("SiteTitle", payload.siteTitle);
  if (payload.metaDescription) {
    formData.append("MetaDescription", payload.metaDescription);
  }
  if (payload.logo) {
    formData.append("Logo", payload.logo);
  }
  if (payload.favicon) {
    formData.append("Favicon", payload.favicon);
  }

  const response = await apiClient.post<SetupInitializeResponse>("/setup/initialize", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export function useSetupStatus() {
  return useQuery({ queryKey: queryKeys.setupStatus, queryFn: getStatus });
}

export function useInitializeSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: initialize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.setupStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}
