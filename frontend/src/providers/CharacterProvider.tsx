import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { characters, defaultCharacter } from "../characters/characters";
import { storage } from "../lib/platform";
import { useAuth } from "./AuthProvider";
import type { CharacterTheme } from "../types/character";

const STORAGE_KEY = "ft_character";

interface CharacterContextValue {
  character: CharacterTheme;
  characters: CharacterTheme[];
  setCharacterId: (id: string) => void;
}

const CharacterContext = createContext<CharacterContextValue | null>(null);

function readStoredId(): string {
  return storage.get(STORAGE_KEY) ?? defaultCharacter.id;
}

export function CharacterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [id, setId] = useState<string>(readStoredId);
  const character = characters.find((c) => c.id === id) ?? defaultCharacter;

  const setCharacterId = (newId: string) => {
    setId(newId);
    storage.set(STORAGE_KEY, newId);
  };

  useEffect(() => {
    if (user?.character) {
      setId(user.character);
      storage.set(STORAGE_KEY, user.character);
    }
  }, [user?.character]);

  return (
    <CharacterContext.Provider
      value={{ character, characters, setCharacterId }}
    >
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter(): CharacterContextValue {
  const ctx = useContext(CharacterContext);
  if (!ctx)
    throw new Error("useCharacter must be used within <CharacterProvider>");
  return ctx;
}
