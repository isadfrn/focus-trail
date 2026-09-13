import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { effectTracks, musicTracks } from "../../lib/tracks";
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
  it("lists music and noise with one item per available track", () => {
    renderControls();
    expect(screen.getByText("Música")).toBeInTheDocument();
    expect(screen.getByText("Ruído")).toBeInTheDocument();

    const musicGroup = screen.getByRole("radiogroup", { name: "Música" });
    expect(within(musicGroup).getAllByRole("radio")).toHaveLength(
      musicTracks.length,
    );

    const noiseGroup = screen.getByRole("radiogroup", { name: "Ruído" });
    expect(within(noiseGroup).getAllByRole("radio")).toHaveLength(
      effectTracks.length,
    );
  });

  it("shows a music progress bar with start and end times", () => {
    renderControls();
    expect(screen.getByLabelText("Progresso de Música")).toBeInTheDocument();
    expect(screen.getAllByText("00:00").length).toBeGreaterThanOrEqual(2);
  });

  it("enables the progress bar and seeks once the duration is known", () => {
    renderControls();
    const audio = document.querySelectorAll("audio")[0] as HTMLAudioElement;
    Object.defineProperty(audio, "duration", { configurable: true, value: 180 });
    fireEvent.durationChange(audio);

    const range = screen.getByLabelText("Progresso de Música");
    expect(range).toBeEnabled();
    expect(screen.getByText("03:00")).toBeInTheDocument();

    fireEvent.change(range, { target: { value: "60" } });
    expect(screen.getByText("01:00")).toBeInTheDocument();
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
