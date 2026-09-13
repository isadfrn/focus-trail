import { useEffect, useRef, useState, type CSSProperties } from "react";

import { useSpriteSheet } from "../../hooks/useSpriteSheet";
import type { CharacterTheme } from "../../types/character";

const DEFAULT_FRAME_MS = 140;
const DEFAULT_SPRITE_HEIGHT = 90;
const DEFAULT_TERRAIN_HEIGHT = 96;
const DEFAULT_CAMERA_SECONDS = 20;
const DEFAULT_GROUND_SECONDS = 0.7;
const GROUND_BASE_PX_PER_SEC = DEFAULT_TERRAIN_HEIGHT / DEFAULT_GROUND_SECONDS;
const GROUND_OVERLAP = 2;

interface SceneProps {
  character: CharacterTheme;
  walking: boolean;
}

function useRepeatTileWidth(url: string, heightPx: number): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    const measure = () => {
      if (cancelled || !img.naturalWidth || !img.naturalHeight) return;
      setWidth((img.naturalWidth * heightPx) / img.naturalHeight);
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

  const sprite = useSpriteSheet(character.sheet, character.frames);
  const frameCount = sprite?.frames.length ?? 0;

  const terrainHeight = character.terrainHeight ?? DEFAULT_TERRAIN_HEIGHT;
  const baseline = character.baseline ?? terrainHeight - GROUND_OVERLAP;
  const cameraSpeed = character.cameraSpeed ?? 1;
  const terrainSpeed = character.terrainSpeed ?? 1;
  const spriteSpeed = character.spriteSpeed ?? 1;
  const bgSeconds = DEFAULT_CAMERA_SECONDS / cameraSpeed;
  const frameMs = DEFAULT_FRAME_MS / spriteSpeed;

  const sceneRef = useRef<HTMLDivElement>(null);
  const [bgTileWidth, setBgTileWidth] = useState(0);
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
      setBgTileWidth((img.naturalWidth * height) / img.naturalHeight);
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
    if (frameCount <= 1) return;
    setFrame(0);
    const id = window.setInterval(
      () => setFrame((f) => (f + 1) % frameCount),
      frameMs,
    );
    return () => clearInterval(id);
  }, [walking, frameCount, frameMs]);

  return (
    <div
      ref={sceneRef}
      className="group pointer-events-none fixed inset-0 z-0 overflow-hidden bg-repeat-x [background-position:0_bottom] [background-size:auto_100%] [image-rendering:pixelated] animate-bg-scroll [animation-play-state:paused] data-[walking=true]:[animation-play-state:running]"
      data-walking={walking}
      aria-hidden="true"
      style={
        {
          backgroundColor: character.skyColor,
          backgroundImage: `url(${character.background})`,
          animationDuration: `${bgSeconds}s`,
          "--bg-tile-w": bgTileWidth ? `${bgTileWidth}px` : "1024px",
        } as CSSProperties
      }
    >
      <div
        className="absolute inset-x-0 bottom-0 bg-repeat-x [background-position:0_bottom] [image-rendering:pixelated] animate-ground-scroll [animation-play-state:paused] group-data-[walking=true]:[animation-play-state:running]"
        style={
          {
            height: terrainHeight,
            backgroundImage: `url(${character.terrain})`,
            backgroundSize: `auto ${terrainHeight}px`,
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
  const { contentTop, contentHeight, sheetWidth, sheetHeight, frames } = sprite;
  const rect = frames[frame] ?? frames[0];

  const scale = character.height
    ? character.height / contentHeight
    : Math.max(1, Math.round(DEFAULT_SPRITE_HEIGHT / contentHeight));

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 bg-no-repeat [image-rendering:pixelated]"
      style={{
        bottom: baseline,
        width: rect.width * scale,
        height: contentHeight * scale,
        backgroundImage: `url(${character.sheet})`,
        backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
        backgroundPosition: `${-rect.x * scale}px ${-contentTop * scale}px`,
      }}
    />
  );
}
