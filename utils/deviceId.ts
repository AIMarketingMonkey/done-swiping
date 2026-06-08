const STORAGE_KEY = "vocaira_device_id";

/**
 * Returns a stable per-device identifier, creating and persisting one
 * in localStorage on first use. Returns null when not in the browser.
 */
export function getDeviceId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  let id = window.localStorage.getItem(STORAGE_KEY);

  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, id);
  }

  return id;
}

/** Clears the stored device id (used to "forget" this device's memory). */
export function clearDeviceId(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
