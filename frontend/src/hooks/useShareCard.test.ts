import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/share/share-render", () => ({
  renderShareCard: vi.fn(),
  canvasToBlob: vi.fn(),
}));

import { SHARE_FORMATS, type ShareCardContent } from "../lib/share/share-card";
import { canvasToBlob, renderShareCard } from "../lib/share/share-render";
import type { CharacterTheme } from "../types/character";
import { useShareCard } from "./useShareCard";

const character: CharacterTheme = {
  id: "x",
  name: "X",
  skyColor: "#000000",
  background: "bg",
  terrain: "terrain",
  sheet: "sheet",
};

const content: ShareCardContent = {
  kind: "day",
  kicker: "FOCO DE HOJE",
  seconds: 60,
  stats: [],
};

function params(overrides: Partial<Parameters<typeof useShareCard>[0]> = {}) {
  return {
    character,
    format: SHARE_FORMATS.story,
    content,
    logoUrl: "logo.png",
    linkLabel: "a.dev/focus",
    ...overrides,
  };
}

describe("useShareCard", () => {
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    let counter = 0;
    createObjectURL.mockImplementation(() => `blob:preview-${++counter}`);
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    vi.mocked(renderShareCard).mockResolvedValue({} as HTMLCanvasElement);
    vi.mocked(canvasToBlob).mockResolvedValue(new Blob(["png"]));
  });

  afterEach(() => {
    vi.clearAllMocks();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("stays idle without content", () => {
    const { result } = renderHook(() => useShareCard(params({ content: null })));
    expect(result.current.status).toBe("idle");
    expect(renderShareCard).not.toHaveBeenCalled();
  });

  it("renders the card and exposes the blob and a preview URL", async () => {
    const { result } = renderHook(() => useShareCard(params()));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.blob).toBeInstanceOf(Blob);
    expect(result.current.previewUrl).toBe("blob:preview-1");
    expect(renderShareCard).toHaveBeenCalledWith(
      expect.objectContaining({ linkLabel: "a.dev/focus", logoUrl: "logo.png" }),
    );
  });

  it("re-renders when the content changes and revokes the previous preview", async () => {
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useShareCard>[0]) => useShareCard(props),
      { initialProps: params() },
    );
    await waitFor(() => expect(result.current.previewUrl).toBe("blob:preview-1"));

    rerender(params({ content: { ...content, seconds: 120 } }));
    await waitFor(() => expect(result.current.previewUrl).toBe("blob:preview-2"));
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
  });

  it("reports an error when rendering fails", async () => {
    vi.mocked(renderShareCard).mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useShareCard(params()));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.blob).toBeNull();
  });

  it("revokes the preview on unmount", async () => {
    const { result, unmount } = renderHook(() => useShareCard(params()));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
  });
});
