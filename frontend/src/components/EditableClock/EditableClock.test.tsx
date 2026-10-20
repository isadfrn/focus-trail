import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EditableClock } from "./EditableClock";

function renderClock(
  overrides: Partial<Parameters<typeof EditableClock>[0]> = {},
) {
  const onCommit = vi.fn();
  const view = render(
    <EditableClock
      remaining={1200}
      running={false}
      editable
      onCommit={onCommit}
      {...overrides}
    />,
  );
  return { onCommit, ...view };
}

describe("EditableClock", () => {
  it("shows the formatted time as an editable button when idle", () => {
    renderClock();
    expect(screen.getByRole("button", { name: /20:00/ })).toBeInTheDocument();
  });

  it("is a plain timer while running", () => {
    renderClock({ running: true, editable: false });
    expect(screen.getByRole("timer")).toHaveAccessibleName(
      "Tempo restante: 20:00",
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("opens an input prefilled with the minutes when clicked", () => {
    renderClock();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByLabelText("Duração em minutos")).toHaveValue(20);
  });

  it("commits the typed value on Enter", () => {
    const { onCommit } = renderClock();
    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByLabelText("Duração em minutos");
    fireEvent.change(input, { target: { value: "45" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCommit).toHaveBeenCalledWith("45");
    expect(
      screen.queryByLabelText("Duração em minutos"),
    ).not.toBeInTheDocument();
  });

  it("commits the typed value on blur only once", () => {
    const { onCommit } = renderClock();
    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByLabelText("Duração em minutos");
    fireEvent.change(input, { target: { value: "30" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("commits on blur", () => {
    const { onCommit } = renderClock();
    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByLabelText("Duração em minutos");
    fireEvent.change(input, { target: { value: "15" } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledWith("15");
  });

  it("cancels on Escape without committing", () => {
    const { onCommit } = renderClock();
    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByLabelText("Duração em minutos");
    fireEvent.change(input, { target: { value: "99" } });
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.blur(input);
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /20:00/ })).toBeInTheDocument();
  });

  it("closes the editor when the timer starts running", () => {
    const { rerender, onCommit } = renderClock();
    fireEvent.click(screen.getByRole("button"));
    rerender(
      <EditableClock
        remaining={1200}
        running
        editable={false}
        onCommit={onCommit}
      />,
    );
    expect(
      screen.queryByLabelText("Duração em minutos"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("timer")).toBeInTheDocument();
  });
});
