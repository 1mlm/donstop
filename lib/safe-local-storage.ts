// src/lib/safe-local-storage.ts
// Provides a safe wrapper for localStorage access, with fallback and error detection.

export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export const safeLocalStorage = {
  getItem(key: string): string | null {
    if (!isLocalStorageAvailable()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    if (!isLocalStorageAvailable()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  },
  removeItem(key: string): void {
    if (!isLocalStorageAvailable()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {}
  },
};
