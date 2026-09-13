import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AudioProvider } from "../../providers/AudioProvider";
import { AudioControls } from "./AudioControls";

function renderControls() {
  return render(
    <AudioProvider>
      <AudioControls />
    </AudioProvider>,
  );
}

describe("AudioControls", () => {
  it("lists music and noise with the available tracks", () => {
    renderControls();
    expect(screen.getByText("Música")).toBeInTheDocument();
    expect(screen.getByText("Ruído")).toBeInTheDocument();
    expect(screen.getByText("Lofi1")).toBeInTheDocument();
    expect(screen.getByText("Rain")).toBeInTheDocument();
  });

  it("toggles music play/pause", () => {
    renderControls();
    fireEvent.click(screen.getByLabelText("Tocar Música"));
    expect(screen.getByLabelText("Pausar Música")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Pausar Música"));
    expect(screen.getByLabelText("Tocar Música")).toBeInTheDocument();
  });

  it("plays the noise without affecting the music", () => {
    renderControls();
    fireEvent.click(screen.getByLabelText("Tocar Ruído"));
    expect(screen.getByLabelText("Pausar Ruído")).toBeInTheDocument();
    expect(screen.getByLabelText("Tocar Música")).toBeInTheDocument();
  });
});
