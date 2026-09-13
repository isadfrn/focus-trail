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
