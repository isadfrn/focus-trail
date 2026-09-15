import { storage } from "./platform/storage";

const CHIME_KEY = "ft_audio_chime";

type AudioContextConstructor = new () => AudioContext;

function resolveAudioContext(): AudioContextConstructor | null {
  const scope = window as typeof window & {
    webkitAudioContext?: AudioContextConstructor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext ?? null;
}

export function isChimeEnabled(): boolean {
  return storage.get(CHIME_KEY) !== "false";
}

export function persistChimeEnabled(enabled: boolean): void {
  storage.set(CHIME_KEY, enabled ? "true" : "false");
}

export function playChime(volume = 0.4): void {
  const AudioContextClass = resolveAudioContext();
  if (!AudioContextClass) return;
  try {
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(volume, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.6);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => {
      void context.close();
    };
    oscillator.start();
    oscillator.stop(context.currentTime + 0.6);
  } catch {
  }
}

export function playSessionChime(volume?: number): void {
  if (!isChimeEnabled()) return;
  playChime(volume);
}
