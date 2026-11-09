const STORAGE_KEY = "gota.apiUrl";
const DEFAULT_API_URL: string = import.meta.env.VITE_GOTA_API_URL ?? "http://localhost:3000";

export function getApiUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

export function normalizeApiUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function saveApiUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url);
}
