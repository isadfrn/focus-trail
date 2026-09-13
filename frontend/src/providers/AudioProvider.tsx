import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { storage } from "../lib/platform/storage";
import {
  effectTracks,
  musicTracks,
  nextIndex,
  prevIndex,
  type Track,
} from "../lib/tracks";

const MUSIC_KEY = "ft_audio_music";
const EFFECT_KEY = "ft_audio_effect";

interface Channel {
  tracks: Track[];
  current: Track | null;
  playing: boolean;
}

interface AudioValue {
  music: Channel;
  effect: Channel;
  toggleMusic: () => void;
  selectMusic: (id: string) => void;
  nextMusic: () => void;
  prevMusic: () => void;
  toggleEffect: () => void;
  selectEffect: (id: string) => void;
}

const Context = createContext<AudioValue | null>(null);

export function useAudio(): AudioValue {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

function safePlay(el: HTMLAudioElement | null) {
  if (!el) return;
  const p = el.play();
  if (p && typeof p.catch === "function") p.catch(() => {});
}

function initialIndex(tracks: Track[], key: string): number {
  const id = storage.get(key);
  if (!id) return 0;
  const i = tracks.findIndex((t) => t.id === id);
  return i >= 0 ? i : 0;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const effectRef = useRef<HTMLAudioElement | null>(null);

  const [musicIndex, setMusicIndex] = useState(() =>
    initialIndex(musicTracks, MUSIC_KEY),
  );
  const [effectIndex, setEffectIndex] = useState(() =>
    initialIndex(effectTracks, EFFECT_KEY),
  );
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [effectPlaying, setEffectPlaying] = useState(false);

  const musicCurrent = musicTracks[musicIndex] ?? null;
  const effectCurrent = effectTracks[effectIndex] ?? null;

  useEffect(() => {
    if (musicCurrent) storage.set(MUSIC_KEY, musicCurrent.id);
  }, [musicCurrent]);

  useEffect(() => {
    if (effectCurrent) storage.set(EFFECT_KEY, effectCurrent.id);
  }, [effectCurrent]);

  useEffect(() => {
    const el = musicRef.current;
    if (!el) return;
    if (musicPlaying) safePlay(el);
    else el.pause();
  }, [musicPlaying, musicCurrent]);

  useEffect(() => {
    const el = effectRef.current;
    if (!el) return;
    if (effectPlaying) safePlay(el);
    else el.pause();
  }, [effectPlaying, effectCurrent]);

  const toggleMusic = useCallback(() => {
    if (!musicTracks.length) return;
    const el = musicRef.current;
    if (musicPlaying) {
      el?.pause();
      setMusicPlaying(false);
    } else {
      safePlay(el);
      setMusicPlaying(true);
    }
  }, [musicPlaying]);

  const selectMusic = useCallback((id: string) => {
    const i = musicTracks.findIndex((t) => t.id === id);
    if (i >= 0) setMusicIndex(i);
  }, []);

  const nextMusic = useCallback(() => {
    setMusicIndex((i) => nextIndex(i, musicTracks.length));
  }, []);

  const prevMusic = useCallback(() => {
    setMusicIndex((i) => prevIndex(i, musicTracks.length));
  }, []);

  const handleMusicEnded = useCallback(() => {
    if (musicTracks.length <= 1) {
      const el = musicRef.current;
      if (el) {
        el.currentTime = 0;
        safePlay(el);
      }
      return;
    }
    setMusicIndex((i) => nextIndex(i, musicTracks.length));
  }, []);

  const toggleEffect = useCallback(() => {
    if (!effectTracks.length) return;
    const el = effectRef.current;
    if (effectPlaying) {
      el?.pause();
      setEffectPlaying(false);
    } else {
      safePlay(el);
      setEffectPlaying(true);
    }
  }, [effectPlaying]);

  const selectEffect = useCallback((id: string) => {
    const i = effectTracks.findIndex((t) => t.id === id);
    if (i >= 0) setEffectIndex(i);
  }, []);

  const value = useMemo<AudioValue>(
    () => ({
      music: { tracks: musicTracks, current: musicCurrent, playing: musicPlaying },
      effect: {
        tracks: effectTracks,
        current: effectCurrent,
        playing: effectPlaying,
      },
      toggleMusic,
      selectMusic,
      nextMusic,
      prevMusic,
      toggleEffect,
      selectEffect,
    }),
    [
      musicCurrent,
      musicPlaying,
      effectCurrent,
      effectPlaying,
      toggleMusic,
      selectMusic,
      nextMusic,
      prevMusic,
      toggleEffect,
      selectEffect,
    ],
  );

  return (
    <Context.Provider value={value}>
      {children}
      <audio ref={musicRef} src={musicCurrent?.url} onEnded={handleMusicEnded} />
      <audio ref={effectRef} src={effectCurrent?.url} loop />
    </Context.Provider>
  );
}
