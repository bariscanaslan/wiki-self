type Listener = () => void;

const STORAGE_KEY = "wikiself.refreshToken";

let accessToken: string | null = null;
let refreshToken: string | null = null;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function setTokens(newAccessToken: string | null, newRefreshToken: string | null): void {
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;

  if (typeof window !== "undefined") {
    if (newRefreshToken) {
      window.localStorage.setItem(STORAGE_KEY, newRefreshToken);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  listeners.forEach((listener) => listener());
}

export function clearTokens(): void {
  setTokens(null, null);
}

export function loadPersistedRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(STORAGE_KEY);
}

export function subscribeToTokenChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
