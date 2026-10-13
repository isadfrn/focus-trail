import { useEffect, useRef, useState, type CSSProperties } from "react";

import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useSpriteSheet } from "../../hooks/useSpriteSheet";
import {
  DEFAULT_TERRAIN_HEIGHT,
  resolveBaseline,
  resolveSpriteScale,
  resolveTerrainHeight,
} from "../../lib/scene-metrics";
import type { CharacterTheme } from "../../types/character";

const DEFAULT_FRAME_MS = 140;
const DEFAULT_CAMERA_SECONDS = 20;
const DEFAULT_GROUND_SECONDS = 0.7;
const GROUND_BASE_PX_PER_SEC = DEFAULT_TERRAIN_HEIGHT / DEFAULT_GROUND_SECONDS;

interface SceneProps {
  character: CharacterTheme;
  walking: boolean;
}

function scaledTileWidth(
  naturalWidth: number,
  naturalHeight: number,
  heightPx: number,
): number {
  return Math.max(1, Math.round((naturalWidth * heightPx) / naturalHeight));
}

function useRepeatTileWidth(url: string, heightPx: number): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    const measure = () => {
      if (cancelled || !img.naturalWidth || !img.naturalHeight) return;
      setWidth(scaledTileWidth(img.naturalWidth, img.naturalHeight, heightPx));
    };
    img.onload = measure;
    img.src = url;
    if (img.complete) measure();
    return () => {
      cancelled = true;
    };
  }, [url, heightPx]);
  return width;
}

export function Scene({ character, walking }: SceneProps) {
  const [frame, setFrame] = useState(0);
  const [hasWalked, setHasWalked] = useState(false);
  const reducedMotion = useReducedMotion();

  const sprite = useSpriteSheet(character.sheet, {
    frameCount: character.frames,
    grid: character.grid,
  });
  const frameCount = sprite?.frames.length ?? 0;

  const terrainHeight = resolveTerrainHeight(character);
  const baseline = resolveBaseline(character);
  const cameraSpeed = character.cameraSpeed ?? 1;
  const terrainSpeed = character.terrainSpeed ?? 1;
  const spriteSpeed = character.spriteSpeed ?? 1;
  const bgSeconds = DEFAULT_CAMERA_SECONDS / cameraSpeed;
  const frameMs = DEFAULT_FRAME_MS / spriteSpeed;

  const sceneRef = useRef<HTMLDivElement>(null);
  const [bgTileWidth, setBgTileWidth] = useState(0);
  const [bgUpscaled, setBgUpscaled] = useState(true);
  const groundTileWidth = useRepeatTileWidth(character.terrain, terrainHeight);
  const groundPxPerSec = GROUND_BASE_PX_PER_SEC * cameraSpeed * terrainSpeed;
  const groundSeconds =
    groundTileWidth > 0
      ? groundTileWidth / groundPxPerSec
      : DEFAULT_GROUND_SECONDS;

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    let cancelled = false;
    const img = new Image();
    const measure = () => {
      if (cancelled || !img.naturalWidth || !img.naturalHeight) return;
      const height = el.clientHeight || window.innerHeight;
      setBgTileWidth(scaledTileWidth(img.naturalWidth, img.naturalHeight, height));
      setBgUpscaled(height >= img.naturalHeight);
    };
    img.onload = measure;
    img.src = character.background;
    if (img.complete) measure();
    window.addEventListener("resize", measure);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", measure);
    };
  }, [character.background]);

  useEffect(() => {
    if (!walking) return;
    setHasWalked(true);
    if (reducedMotion || frameCount <= 1) return;
    setFrame(0);
    const id = window.setInterval(
      () => setFrame((f) => (f + 1) % frameCount),
      frameMs,
    );
    return () => clearInterval(id);
  }, [walking, frameCount, frameMs, reducedMotion]);

  return (
    <div
      ref={sceneRef}
      className="group pointer-events-none fixed inset-0 z-0 overflow-hidden"
      data-walking={walking}
      aria-hidden="true"
      style={{ backgroundColor: character.skyColor }}
    >
      <div
        className="absolute inset-y-0 left-0 bg-repeat-x [background-position:0_bottom] [will-change:transform] animate-bg-scroll [animation-play-state:paused] group-data-[walking=true]:[animation-play-state:running]"
        style={
          {
            width: "calc(100% + var(--bg-tile-w))",
            backgroundImage: `url(${character.background})`,
            backgroundSize: bgTileWidth ? `${bgTileWidth}px 100%` : "auto 100%",
            imageRendering: bgUpscaled ? "pixelated" : "auto",
            animationDuration: `${bgSeconds}s`,
            "--bg-tile-w": bgTileWidth ? `${bgTileWidth}px` : "1024px",
          } as CSSProperties
        }
      />
      <div
        className="absolute bottom-0 left-0 bg-repeat-x [background-position:0_bottom] [image-rendering:pixelated] [will-change:transform] animate-ground-scroll [animation-play-state:paused] group-data-[walking=true]:[animation-play-state:running]"
        style={
          {
            width: "calc(100% + var(--ground-tile-w))",
            height: terrainHeight,
            backgroundImage: `url(${character.terrain})`,
            backgroundSize: groundTileWidth
              ? `${groundTileWidth}px ${terrainHeight}px`
              : `auto ${terrainHeight}px`,
            animationDuration: `${groundSeconds}s`,
            "--ground-tile-w": groundTileWidth ? `${groundTileWidth}px` : "96px",
          } as CSSProperties
        }
      />
      {sprite && (
        <CharacterSprite
          character={character}
          sprite={sprite}
          frame={hasWalked ? frame % frameCount : 0}
          baseline={baseline}
        />
      )}
    </div>
  );
}

function CharacterSprite({
  character,
  sprite,
  frame,
  baseline,
}: {
  character: CharacterTheme;
  sprite: NonNullable<ReturnType<typeof useSpriteSheet>>;
  frame: number;
  baseline: number;
}) {
  const { contentHeight, sheetWidth, sheetHeight, frames } = sprite;
  const rect = frames[frame] ?? frames[0];

  const scale = resolveSpriteScale(character, contentHeight);

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 bg-no-repeat"
      style={{
        imageRendering: scale < 1 ? "auto" : "pixelated",
        bottom: baseline,
        width: rect.width * scale,
        height: contentHeight * scale,
        backgroundImage: `url(${character.sheet})`,
        backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
        backgroundPosition: `${-rect.x * scale}px ${-rect.y * scale}px`,
      }}
    />
  );
}
