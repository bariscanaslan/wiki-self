export interface SearchResultItem {
  documentId: string;
  title: string;
  snippet: string;
  folderId: string;
  rank: number;
}

export interface SearchResponse {
  results: SearchResultItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}
