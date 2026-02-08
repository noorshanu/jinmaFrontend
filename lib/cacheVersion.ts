/**
 * App cache version. Bump this (or set NEXT_PUBLIC_APP_VERSION) when you deploy
 * so users get a one-time cache clear and fresh UI.
 */
export const APP_CACHE_VERSION =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_VERSION
    ? process.env.NEXT_PUBLIC_APP_VERSION
    : "2.7.0";

const STORAGE_KEY = "app_cache_version";

/** Keys to keep when clearing localStorage (auth, etc.) */
const KEEP_KEYS = new Set(["token", "user", STORAGE_KEY]);

/**
 * If the app version changed, clear caches (except auth), set new version, and reload once.
 * Call once on mount in dashboard layout.
 */
export function runCacheVersionCheck(): void {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === APP_CACHE_VERSION) return;

  // Clear Cache API (service worker / cache storage)
  if ("caches" in window && typeof caches.keys === "function") {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    }).catch(() => {});
  }

  // Clear sessionStorage (no auth there)
  try {
    sessionStorage.clear();
  } catch {
    // ignore
  }

  // Clear localStorage except auth and version
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !KEEP_KEYS.has(key)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }

  // Set new version and reload so new JS/CSS load
  localStorage.setItem(STORAGE_KEY, APP_CACHE_VERSION);
  window.location.reload();
}
