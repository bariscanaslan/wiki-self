import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import { queryKeys } from "./queryKeys";
import type { SearchResponse } from "../types";

async function search(query: string, page: number, pageSize: number, categoryId?: string): Promise<SearchResponse> {
  const response = await apiClient.get<SearchResponse>("/search", {
    params: { q: query || undefined, page, pageSize, categoryId: categoryId || undefined },
  });
  return response.data;
}

export function useSearch(query: string, page = 1, pageSize = 20, categoryId?: string) {
  return useQuery({
    queryKey: queryKeys.search(query, page, categoryId),
    queryFn: () => search(query, page, pageSize, categoryId),
    enabled: query.trim().length > 0 || Boolean(categoryId),
    placeholderData: (previous) => previous,
  });
}
