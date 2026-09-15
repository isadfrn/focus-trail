import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../providers/AudioProvider", () => ({
  useAudio: () => ({
    music: {
      tracks: [],
      current: null,
      playing: false,
      position: 0,
      duration: 0,
      volume: 1,
    },
    effect: { tracks: [], current: null, playing: false, volume: 1 },
    toggleMusic: () => {},
    selectMusic: () => {},
    nextMusic: () => {},
    prevMusic: () => {},
    seekMusic: () => {},
    setMusicVolume: () => {},
    toggleEffect: () => {},
    selectEffect: () => {},
    setEffectVolume: () => {},
    chimeEnabled: true,
    setChimeEnabled: () => {},
  }),
}));

import { AudioControls } from "./AudioControls";

describe("AudioControls (no files)", () => {
  it("shows an empty state and disables the play buttons", () => {
    render(<AudioControls />);
    expect(screen.getAllByText("Nenhum arquivo.")).toHaveLength(2);
    expect(screen.getByLabelText("Tocar Música")).toBeDisabled();
    expect(screen.getByLabelText("Tocar Ruído")).toBeDisabled();
  });
});
