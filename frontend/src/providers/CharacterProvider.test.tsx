import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  user: null as { character?: string } | null,
}));

vi.mock("./AuthProvider", () => ({
  useAuth: () => ({ user: auth.user }),
}));

import { characters, defaultCharacter } from "../characters/characters";
import { CharacterProvider, useCharacter } from "./CharacterProvider";

const wrapper = ({ children }: { children: ReactNode }) => (
  <CharacterProvider>{children}</CharacterProvider>
);

beforeEach(() => {
  auth.user = null;
  localStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

describe("CharacterProvider", () => {
  it("throws when used outside the provider", () => {
    expect(() => renderHook(() => useCharacter())).toThrow();
  });

  it("exposes a default character and the full list", () => {
    const { result } = renderHook(() => useCharacter(), { wrapper });
    expect(result.current.character).toBeTruthy();
    expect(result.current.characters.length).toBeGreaterThan(0);
  });

  it("selects a character and persists it", () => {
    const { result } = renderHook(() => useCharacter(), { wrapper });
    const target = characters[characters.length - 1];
    act(() => result.current.setCharacterId(target.id));
    expect(result.current.character.id).toBe(target.id);
    expect(localStorage.getItem("ft_character")).toBe(target.id);
  });

  it("falls back to the default when the stored id is unknown", () => {
    localStorage.setItem("ft_character", "does-not-exist");
    const { result } = renderHook(() => useCharacter(), { wrapper });
    expect(result.current.character.id).toBe(defaultCharacter.id);
  });

  it("follows the authenticated user's character", () => {
    const target = characters[characters.length - 1].id;
    auth.user = { character: target };
    const { result } = renderHook(() => useCharacter(), { wrapper });
    expect(result.current.character.id).toBe(target);
  });
});
