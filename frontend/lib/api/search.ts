import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import { queryKeys } from "./queryKeys";
import type { SearchResponse } from "../types";

async function search(query: string, page: number, pageSize: number, tagId?: string): Promise<SearchResponse> {
  const response = await apiClient.get<SearchResponse>("/search", {
    params: { q: query || undefined, page, pageSize, tagId: tagId || undefined },
  });
  return response.data;
}

export function useSearch(query: string, page = 1, pageSize = 20, tagId?: string) {
  return useQuery({
    queryKey: queryKeys.search(query, page, tagId),
    queryFn: () => search(query, page, pageSize, tagId),
    enabled: query.trim().length > 0 || Boolean(tagId),
    placeholderData: (previous) => previous,
  });
}
