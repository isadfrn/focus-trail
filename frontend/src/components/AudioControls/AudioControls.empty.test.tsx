import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../providers/AudioProvider", () => ({
  useAudio: () => ({
    music: { tracks: [], current: null, playing: false },
    effect: { tracks: [], current: null, playing: false },
    toggleMusic: () => {},
    selectMusic: () => {},
    toggleEffect: () => {},
    selectEffect: () => {},
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
