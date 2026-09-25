export type ShareOutcome = "shared" | "cancelled" | "failed";

const X_INTENT_URL = "https://x.com/intent/post";
const LINKEDIN_SHARE_URL = "https://www.linkedin.com/sharing/share-offsite/";
const REVOKE_DELAY_MS = 1000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function buildShareFileName(
  kind: "day" | "task",
  now: Date = new Date(),
): string {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `focus-trail-${kind === "day" ? "dia" : "tarefa"}-${date}.png`;
}

export function createShareFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: "image/png" });
}

export function canShareFile(file: File): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  );
}

export async function shareFile(
  file: File,
  caption: string,
): Promise<ShareOutcome> {
  try {
    await navigator.share({ files: [file], text: caption });
    return "shared";
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError"
      ? "cancelled"
      : "failed";
  }
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), REVOKE_DELAY_MS);
}

export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard?.write ||
    typeof ClipboardItem === "undefined"
  ) {
    return false;
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function openInNewTab(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function buildXIntentUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text, url });
  return `${X_INTENT_URL}?${params.toString()}`;
}

export function buildLinkedInShareUrl(url: string): string {
  const params = new URLSearchParams({ url });
  return `${LINKEDIN_SHARE_URL}?${params.toString()}`;
}
