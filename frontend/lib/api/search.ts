import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import { queryKeys } from "./queryKeys";
import type { SearchResponse } from "../types";

async function search(query: string, page: number, pageSize: number): Promise<SearchResponse> {
  const response = await apiClient.get<SearchResponse>("/search", { params: { q: query, page, pageSize } });
  return response.data;
}

export function useSearch(query: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: queryKeys.search(query, page),
    queryFn: () => search(query, page, pageSize),
    enabled: query.trim().length > 0,
    placeholderData: (previous) => previous,
  });
}
