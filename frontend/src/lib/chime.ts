import cycleDoneUrl from "../assets/interface/cicle-done.mp3";
import { storage } from "./platform/storage";

const CHIME_KEY = "ft_audio_chime";

export function isChimeEnabled(): boolean {
  return storage.get(CHIME_KEY) !== "false";
}

export function persistChimeEnabled(enabled: boolean): void {
  storage.set(CHIME_KEY, enabled ? "true" : "false");
}

export function playChime(volume = 1): void {
  try {
    const audio = new Audio(cycleDoneUrl);
    audio.volume = volume;
    void audio.play().catch(() => {});
  } catch {}
}

export function playSessionChime(volume?: number): void {
  if (!isChimeEnabled()) return;
  playChime(volume);
}
