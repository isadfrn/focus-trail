import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useAuthMock = vi.fn();
vi.mock("../../providers/AuthProvider", () => ({
  useAuth: () => useAuthMock(),
}));
vi.mock("../../lib/chime", () => ({ playSessionChime: vi.fn() }));
vi.mock("../../lib/platform", () => ({ notify: vi.fn() }));

import { playSessionChime } from "../../lib/chime";
import { notify } from "../../lib/platform";
import { HydrationReminder } from "./HydrationReminder";

const MINUTE = 60_000;

function setUser(hydrationReminderMinutes: number | null) {
  useAuthMock.mockReturnValue({
    user:
      hydrationReminderMinutes === null ? null : { hydrationReminderMinutes },
  });
}

function advanceMinutes(minutes: number) {
  act(() => {
    vi.advanceTimersByTime(minutes * MINUTE);
  });
}

function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  setDocumentHidden(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("HydrationReminder", () => {
  it("renders nothing before the interval elapses", () => {
    setUser(30);
    render(<HydrationReminder />);
    advanceMinutes(29);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the reminder and plays the chime when due", () => {
    setUser(30);
    render(<HydrationReminder />);
    advanceMinutes(30);
    expect(screen.getByRole("alert")).toHaveTextContent("Hora de beber água");
    expect(playSessionChime).toHaveBeenCalledTimes(1);
    expect(notify).not.toHaveBeenCalled();
  });

  it("also sends a system notification when the page is hidden", () => {
    setDocumentHidden(true);
    setUser(30);
    render(<HydrationReminder />);
    advanceMinutes(30);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("stays off when the user has no reminder configured", () => {
    setUser(0);
    render(<HydrationReminder />);
    advanceMinutes(600);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("stays off when there is no signed-in user", () => {
    setUser(null);
    render(<HydrationReminder />);
    advanceMinutes(600);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("hides after confirming and returns one interval later", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    setUser(30);
    render(<HydrationReminder />);
    advanceMinutes(30);
    await user.click(screen.getByRole("button", { name: "Já bebi" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    advanceMinutes(30);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("hides after snoozing and returns after five minutes", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    setUser(60);
    render(<HydrationReminder />);
    advanceMinutes(60);
    await user.click(screen.getByRole("button", { name: "Adiar 5 min" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    advanceMinutes(5);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
