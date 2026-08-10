export interface SiteSettingsResponse {
  companyName: string;
  logoUrl: string | null;
  siteTitle: string;
  metaDescription: string | null;
  faviconUrl: string | null;
  uiFont: string;
  documentFont: string;
  isInitialized: boolean;
}

export interface UpdateSiteSettingsRequest {
  companyName: string;
  siteTitle: string;
  metaDescription?: string | null;
  uiFont: string;
  documentFont: string;
  logoAssetId?: string | null;
  faviconAssetId?: string | null;
}
