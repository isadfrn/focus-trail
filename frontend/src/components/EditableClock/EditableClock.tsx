import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "../../lib/cn";
import { formatClock } from "../../lib/format";

interface EditableClockProps {
  remaining: number;
  running: boolean;
  editable: boolean;
  onCommit: (rawMinutes: string) => void;
}

const clockClasses =
  "rounded-2xl border border-scene-panel-border bg-scene-panel px-6 py-2 font-extrabold leading-none tabular-nums tracking-[2px] backdrop-blur-sm [font-size:clamp(52px,15vw,96px)] [text-shadow:0_2px_14px_rgba(11,21,24,0.35)]";

export function EditableClock({
  remaining,
  running,
  editable,
  onCommit,
}: EditableClockProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!editable) setEditing(false);
  }, [editable]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const startEditing = () => {
    finishedRef.current = false;
    setDraft(String(Math.max(1, Math.round(remaining / 60))));
    setEditing(true);
  };

  const finishEditing = (shouldCommit: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setEditing(false);
    if (shouldCommit) onCommit(draft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") finishEditing(true);
    if (event.key === "Escape") finishEditing(false);
  };

  const clock = formatClock(remaining);
  const colorClass = running ? "text-scene-accent" : "text-scene-foreground";

  if (editing) {
    return (
      <div
        className={cn(
          clockClasses,
          "flex items-baseline justify-center gap-2",
          colorClass,
        )}
      >
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => finishEditing(true)}
          aria-label={t("timer.clock.durationLabel")}
          className="w-[3ch] bg-transparent text-center font-[inherit] tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="text-[0.3em] font-semibold tracking-normal">
          {t("timer.clock.minutesUnit")}
        </span>
      </div>
    );
  }

  if (!editable) {
    return (
      <div
        role="timer"
        aria-label={t("timer.clock.remaining", { time: clock })}
        className={cn(clockClasses, colorClass)}
      >
        {clock}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      title={t("timer.clock.editHint")}
      aria-label={t("timer.clock.remainingEditable", { time: clock })}
      className={cn(
        clockClasses,
        colorClass,
        "cursor-text transition-colors hover:border-scene-accent focus-visible:outline-none focus-visible:border-scene-accent",
      )}
    >
      {clock}
    </button>
  );
}
