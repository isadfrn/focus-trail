export { storage, type KeyValueStore } from "./storage";
export { notify, canNotify, requestNotifyPermission } from "./notify";

export type Platform = "web" | "ios" | "android" | "desktop";

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

declare global {
  interface Window {
    Capacitor?: CapacitorGlobal;
    __TAURI__?: unknown;
  }
}

/**
 * Which shell the app is running inside. Returns `"web"` today; already detects
 * Capacitor (Android/iOS) and Tauri (desktop) so it starts reporting the real
 * platform the moment those shells are added — no change needed here.
 */
export function getPlatform(): Platform {
  if (typeof window === "undefined") return "web";
  if ("__TAURI__" in window) return "desktop";
  const cap = window.Capacitor;
  if (cap?.isNativePlatform?.()) {
    return cap.getPlatform?.() === "ios" ? "ios" : "android";
  }
  return "web";
}

export function isNativePlatform(): boolean {
  return getPlatform() !== "web";
}
