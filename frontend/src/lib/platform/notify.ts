/** True when a notification can be shown right now (permission already granted). */
export function canNotify(): boolean {
  return (
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );
}

/**
 * Ask the user to allow notifications. Call ONLY from an explicit user action
 * (e.g. an "enable notifications" toggle) — never automatically.
 */
export async function requestNotifyPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * Best-effort local notification. No-op unless permission was already granted,
 * so it never prompts on its own. Web implementation today; route to
 * `@capacitor/local-notifications` (mobile) or the Tauri notification plugin
 * here when those shells are added.
 */
export function notify(title: string, body?: string): void {
  if (!canNotify()) return;
  try {
    new Notification(title, body ? { body } : undefined);
  } catch {
    // ignore
  }
}
