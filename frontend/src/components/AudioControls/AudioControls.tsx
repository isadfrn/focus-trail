import * as RadioGroup from "@radix-ui/react-radio-group";

import { formatClock } from "../../lib/format";
import type { Track } from "../../lib/tracks";
import { useAudio } from "../../providers/AudioProvider";

const listClass =
  "flex max-h-40 flex-col gap-0.5 overflow-y-auto overscroll-y-contain pr-1 scrollbar-thin";

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

interface Progress {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

interface ChannelProps {
  label: string;
  tracks: Track[];
  currentId: string | null;
  playing: boolean;
  volume: number;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onVolume: (value: number) => void;
  progress?: Progress;
}

function ChannelSection({
  label,
  tracks,
  currentId,
  playing,
  volume,
  onToggle,
  onSelect,
  onVolume,
  progress,
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

      {tracks.length > 0 && (
        <div className="flex items-center gap-2 px-3 pb-1">
          <span className="w-9 shrink-0 text-right text-[10px] uppercase tracking-wide text-muted">
            Vol
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolume(Number(e.target.value))}
            aria-label={`Volume de ${label}`}
            className="h-1 flex-1 cursor-pointer accent-primary"
          />
          <span className="w-9 shrink-0 text-[10px] tabular-nums text-muted">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}

      {progress && tracks.length > 0 && (
        <div className="flex items-center gap-2 px-3 pb-1">
          <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-muted">
            {formatClock(progress.position)}
          </span>
          <input
            type="range"
            min={0}
            max={progress.duration || 0}
            step="any"
            value={Math.min(progress.position, progress.duration || 0)}
            onChange={(e) => progress.onSeek(Number(e.target.value))}
            disabled={!progress.duration}
            aria-label={`Progresso de ${label}`}
            className="h-1 flex-1 cursor-pointer accent-primary disabled:cursor-not-allowed"
          />
          <span className="w-9 shrink-0 text-[10px] tabular-nums text-muted">
            {formatClock(progress.duration)}
          </span>
        </div>
      )}

      {tracks.length > 0 ? (
        <RadioGroup.Root
          value={currentId ?? undefined}
          onValueChange={onSelect}
          aria-label={label}
          className={listClass}
        >
          {tracks.map((t) => (
            <RadioGroup.Item key={t.id} value={t.id} className={itemClass}>
              <span className="inline-flex w-3.5 shrink-0 justify-center text-primary">
                <RadioGroup.Indicator>
                  <DotIcon />
                </RadioGroup.Indicator>
              </span>
              <span className="min-w-0 flex-1 truncate">{t.name}</span>
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
  const {
    music,
    effect,
    toggleMusic,
    selectMusic,
    seekMusic,
    setMusicVolume,
    toggleEffect,
    selectEffect,
    setEffectVolume,
    chimeEnabled,
    setChimeEnabled,
  } = useAudio();

  return (
    <div className="flex flex-col gap-2">
      <ChannelSection
        label="Música"
        tracks={music.tracks}
        currentId={music.current?.id ?? null}
        playing={music.playing}
        volume={music.volume}
        onToggle={toggleMusic}
        onSelect={selectMusic}
        onVolume={setMusicVolume}
        progress={{
          position: music.position,
          duration: music.duration,
          onSeek: seekMusic,
        }}
      />
      <ChannelSection
        label="Ruído"
        tracks={effect.tracks}
        currentId={effect.current?.id ?? null}
        playing={effect.playing}
        volume={effect.volume}
        onToggle={toggleEffect}
        onSelect={selectEffect}
        onVolume={setEffectVolume}
      />
      <label className="flex items-center justify-between gap-2 px-3 py-1 text-sm text-foreground">
        <span>Alerta ao fim da sessão</span>
        <input
          type="checkbox"
          checked={chimeEnabled}
          onChange={(e) => setChimeEnabled(e.target.checked)}
          aria-label="Alerta sonoro ao fim da sessão"
          className="size-4 cursor-pointer accent-primary"
        />
      </label>
    </div>
  );
}
