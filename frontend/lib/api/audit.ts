import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import { queryKeys } from "./queryKeys";
import type { AuditLogFilter, AuditLogResponse, PagedResult } from "../types";

async function getAuditLogs(filter: AuditLogFilter): Promise<PagedResult<AuditLogResponse>> {
  const response = await apiClient.get<PagedResult<AuditLogResponse>>("/audit", { params: filter });
  return response.data;
}

export function useAuditLogs(filter: AuditLogFilter) {
  return useQuery({
    queryKey: queryKeys.auditLogs(filter as Record<string, unknown>),
    queryFn: () => getAuditLogs(filter),
  });
}
