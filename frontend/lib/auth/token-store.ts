type Listener = () => void;

let accessToken: string | null = null;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(newAccessToken: string | null): void {
  accessToken = newAccessToken;
  listeners.forEach((listener) => listener());
}

export function clearTokens(): void {
  setAccessToken(null);
}

export function subscribeToTokenChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
