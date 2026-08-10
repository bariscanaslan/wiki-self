import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { queryKeys } from "./queryKeys";
import type { SiteSettingsResponse, UpdateSiteSettingsRequest } from "../types";

async function getSettings(): Promise<SiteSettingsResponse> {
  const response = await apiClient.get<SiteSettingsResponse>("/settings");
  return response.data;
}

async function updateSettings(request: UpdateSiteSettingsRequest): Promise<SiteSettingsResponse> {
  const response = await apiClient.put<SiteSettingsResponse>("/settings", request);
  return response.data;
}

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings, queryFn: getSettings });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings, data);
    },
  });
}
