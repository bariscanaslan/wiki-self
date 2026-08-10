import type { SiteSettingsResponse } from "./settings";
import type { UserResponse } from "./users";

export interface SetupStatusResponse {
  isInitialized: boolean;
}

export interface SetupInitializeResponse {
  admin: UserResponse;
  settings: SiteSettingsResponse;
}
