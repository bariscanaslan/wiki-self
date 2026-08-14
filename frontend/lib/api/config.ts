import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import { queryKeys } from "./queryKeys";
import type { PublicConfigResponse } from "../types";

async function getPublicConfig(): Promise<PublicConfigResponse> {
  const response = await apiClient.get<PublicConfigResponse>("/config");
  return response.data;
}

export function usePublicConfig() {
  return useQuery({ queryKey: queryKeys.publicConfig, queryFn: getPublicConfig });
}
