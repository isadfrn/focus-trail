import { act, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider, useToast } from "./ToastProvider";

const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe("ToastProvider", () => {
  it("returns a no-op toast outside the provider", () => {
    const { result } = renderHook(() => useToast());
    expect(() => result.current("ignored")).not.toThrow();
  });

  it("renders a pushed message", async () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => result.current("Sessao salva"));
    expect(await screen.findByText("Sessao salva")).toBeInTheDocument();
  });

  it("dismisses a message after its duration elapses", async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useToast(), { wrapper });
      act(() => result.current("Temporario"));
      expect(screen.getByText("Temporario")).toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(6000);
      });
      expect(screen.queryByText("Temporario")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

afterEach(() => vi.useRealTimers());
