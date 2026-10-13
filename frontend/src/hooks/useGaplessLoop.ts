import { useEffect, useRef, useState } from "react";

import {
  createGaplessLoop,
  isGaplessLoopSupported,
  type GaplessLoop,
} from "../lib/gapless-loop";

interface GaplessLoopState {
  fallback: boolean;
}

export function useGaplessLoop(
  url: string | undefined,
  playing: boolean,
  volume: number,
): GaplessLoopState {
  const loopRef = useRef<GaplessLoop | null>(null);
  const [fallback, setFallback] = useState(() => !isGaplessLoopSupported());

  useEffect(() => {
    if (fallback || !url) return;
    if (!playing && !loopRef.current) return;

    if (!loopRef.current) loopRef.current = createGaplessLoop();
    const loop = loopRef.current;
    if (!loop) {
      setFallback(true);
      return;
    }

    let cancelled = false;
    loop.load(url).catch(() => {
      if (cancelled) return;
      loop.stop();
      setFallback(true);
    });
    if (playing) loop.start();
    else loop.stop();

    return () => {
      cancelled = true;
    };
  }, [url, playing, fallback]);

  useEffect(() => {
    loopRef.current?.setVolume(volume);
  }, [volume, url, playing]);

  useEffect(() => {
    return () => {
      loopRef.current?.dispose();
      loopRef.current = null;
    };
  }, []);

  return { fallback };
}
