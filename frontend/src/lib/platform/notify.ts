import { isTauri } from "@tauri-apps/api/core";

function loadDesktopNotifications() {
  return import("@tauri-apps/plugin-notification");
}

export async function canNotify(): Promise<boolean> {
  if (isTauri()) {
    try {
      const { isPermissionGranted } = await loadDesktopNotifications();
      return await isPermissionGranted();
    } catch {
      return false;
    }
  }
  return (
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );
}

export async function requestNotifyPermission(): Promise<boolean> {
  if (isTauri()) {
    try {
      const { isPermissionGranted, requestPermission } =
        await loadDesktopNotifications();
      if (await isPermissionGranted()) return true;
      return (await requestPermission()) === "granted";
    } catch {
      return false;
    }
  }
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

async function deliverNotification(title: string, body?: string) {
  try {
    if (!(await canNotify())) return;
    if (isTauri()) {
      const { sendNotification } = await loadDesktopNotifications();
      sendNotification(body ? { title, body } : { title });
      return;
    }
    new Notification(title, body ? { body } : undefined);
  } catch {
  }
}

export function notify(title: string, body?: string): void {
  void deliverNotification(title, body);
}
