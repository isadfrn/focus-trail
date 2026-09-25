import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildLinkedInShareUrl,
  buildShareFileName,
  buildXIntentUrl,
  canShareFile,
  copyImageToClipboard,
  copyTextToClipboard,
  createShareFile,
  downloadBlob,
  openInNewTab,
  shareFile,
} from "./share-actions";

const blob = new Blob(["png"], { type: "image/png" });

describe("file helpers", () => {
  it("names files by kind and local date", () => {
    const now = new Date(2026, 8, 5, 10, 0, 0);
    expect(buildShareFileName("day", now)).toBe("focus-trail-dia-2026-09-05.png");
    expect(buildShareFileName("task", now)).toBe("focus-trail-tarefa-2026-09-05.png");
  });

  it("wraps a blob into a PNG file", () => {
    const file = createShareFile(blob, "card.png");
    expect(file.name).toBe("card.png");
    expect(file.type).toBe("image/png");
  });
});

describe("native sharing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "share");
    Reflect.deleteProperty(navigator, "canShare");
  });

  const file = createShareFile(blob, "card.png");

  it("is unavailable without the Web Share API", () => {
    expect(canShareFile(file)).toBe(false);
  });

  it("asks the browser whether it can share the file", () => {
    Object.assign(navigator, { share: vi.fn(), canShare: vi.fn(() => true) });
    expect(canShareFile(file)).toBe(true);

    Object.assign(navigator, { canShare: vi.fn(() => false) });
    expect(canShareFile(file)).toBe(false);
  });

  it("shares the file with the caption", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share });
    await expect(shareFile(file, "legenda")).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith({ files: [file], text: "legenda" });
  });

  it("reports a cancelled share sheet", async () => {
    Object.assign(navigator, {
      share: vi.fn().mockRejectedValue(new DOMException("x", "AbortError")),
    });
    await expect(shareFile(file, "legenda")).resolves.toBe("cancelled");
  });

  it("reports other failures", async () => {
    Object.assign(navigator, {
      share: vi.fn().mockRejectedValue(new Error("boom")),
    });
    await expect(shareFile(file, "legenda")).resolves.toBe("failed");
  });
});

describe("downloadBlob", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("clicks a temporary download link and revokes the URL later", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => "blob:card");
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    downloadBlob(blob, "card.png");

    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector("a[download]")).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:card");
  });
});

describe("clipboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("copies an image through ClipboardItem", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { write } });
    vi.stubGlobal(
      "ClipboardItem",
      class {
        constructor(public items: Record<string, Blob>) {}
      },
    );
    await expect(copyImageToClipboard(blob)).resolves.toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("fails gracefully when image copy is unsupported or rejected", async () => {
    await expect(copyImageToClipboard(blob)).resolves.toBe(false);

    Object.assign(navigator, {
      clipboard: { write: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    vi.stubGlobal("ClipboardItem", class {});
    await expect(copyImageToClipboard(blob)).resolves.toBe(false);
  });

  it("copies text and reports failures", async () => {
    await expect(copyTextToClipboard("x")).resolves.toBe(false);

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    await expect(copyTextToClipboard("olá")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("olá");

    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    await expect(copyTextToClipboard("olá")).resolves.toBe(false);
  });
});

describe("external intents", () => {
  afterEach(() => vi.restoreAllMocks());

  it("opens links without exposing the opener", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    openInNewTab("https://example.com");
    expect(open).toHaveBeenCalledWith(
      "https://example.com",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("builds the X compose URL with text and link", () => {
    const url = new URL(buildXIntentUrl("Hoje eu foquei 2h", "https://a.dev/focus/?x=1"));
    expect(url.origin + url.pathname).toBe("https://x.com/intent/post");
    expect(url.searchParams.get("text")).toBe("Hoje eu foquei 2h");
    expect(url.searchParams.get("url")).toBe("https://a.dev/focus/?x=1");
  });

  it("builds the LinkedIn share URL", () => {
    const url = new URL(buildLinkedInShareUrl("https://a.dev/focus/"));
    expect(url.origin + url.pathname).toBe(
      "https://www.linkedin.com/sharing/share-offsite/",
    );
    expect(url.searchParams.get("url")).toBe("https://a.dev/focus/");
  });
});
