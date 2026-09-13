import * as RadioGroup from "@radix-ui/react-radio-group";

import { useAudio } from "../../providers/AudioProvider";
import type { Track } from "../../lib/tracks";

const itemClass =
  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground cursor-pointer select-none outline-none hover:bg-background";

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M4 3l9 5-9 5z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M4 3h3v10H4z M9 3h3v10H9z" fill="currentColor" />
    </svg>
  );
}

function DotIcon() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
      <circle cx="6" cy="6" r="3" fill="currentColor" />
    </svg>
  );
}

interface ChannelProps {
  label: string;
  tracks: Track[];
  currentId: string | null;
  playing: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
}

function ChannelSection({
  label,
  tracks,
  currentId,
  playing,
  onToggle,
  onSelect,
}: ChannelProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between px-3 py-1">
        <span className="text-[11px] uppercase tracking-wide text-muted">
          {label}
        </span>
        <button
          type="button"
          onClick={onToggle}
          disabled={tracks.length === 0}
          aria-pressed={playing}
          aria-label={playing ? `Pausar ${label}` : `Tocar ${label}`}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-primary cursor-pointer outline-none hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>

      {tracks.length > 0 ? (
        <RadioGroup.Root
          value={currentId ?? undefined}
          onValueChange={onSelect}
          aria-label={label}
          className="flex flex-col gap-0.5"
        >
          {tracks.map((t) => (
            <RadioGroup.Item key={t.id} value={t.id} className={itemClass}>
              <span className="inline-flex w-3.5 justify-center text-primary">
                <RadioGroup.Indicator>
                  <DotIcon />
                </RadioGroup.Indicator>
              </span>
              {t.name}
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
      ) : (
        <p className="px-3 py-1 text-[12px] text-muted">Nenhum arquivo.</p>
      )}
    </div>
  );
}

export function AudioControls() {
  const { music, effect, toggleMusic, selectMusic, toggleEffect, selectEffect } =
    useAudio();

  return (
    <div className="flex flex-col gap-2">
      <ChannelSection
        label="Música"
        tracks={music.tracks}
        currentId={music.current?.id ?? null}
        playing={music.playing}
        onToggle={toggleMusic}
        onSelect={selectMusic}
      />
      <ChannelSection
        label="Ruído"
        tracks={effect.tracks}
        currentId={effect.current?.id ?? null}
        playing={effect.playing}
        onToggle={toggleEffect}
        onSelect={selectEffect}
      />
    </div>
  );
}
