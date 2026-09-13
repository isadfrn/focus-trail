import * as ToggleGroup from "@radix-ui/react-toggle-group";

import { Button } from "../../components/Button/Button";
import { Scene } from "../../components/Scene/Scene";
import { useTimer } from "../../hooks/useTimer";
import { cn } from "../../lib/cn";
import { formatClock } from "../../lib/format";
import { resolveScenePalette, sceneVars } from "../../lib/scene-palette";
import { useCharacter } from "../../providers/CharacterProvider";

const presetItem =
  "rounded-[10px] border border-scene-panel-border bg-scene-panel px-3.5 py-2 text-sm text-scene-foreground backdrop-blur-sm cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed data-[state=on]:border-scene-accent data-[state=on]:font-semibold data-[state=on]:text-scene-accent";

export function TimerPage() {
  const { character } = useCharacter();
  const { type, remaining, status, running, presets, selectPreset, start, stop } =
    useTimer();

  const palette = resolveScenePalette(character);

  return (
    <div style={sceneVars(palette)}>
      <Scene character={character} walking={running} />
      <div className="relative z-[1] flex flex-col items-center gap-[18px] pt-[5dvh] text-center max-sm:gap-3.5 max-sm:pt-[3dvh]">
        <ToggleGroup.Root
          type="single"
          value={type}
          disabled={running}
          onValueChange={(v) => {
            const p = presets.find((x) => x.type === v);
            if (p) selectPreset(p.type, p.minutes);
          }}
          className="flex flex-wrap justify-center gap-2.5"
        >
          {presets.map((p) => (
            <ToggleGroup.Item
              key={p.type}
              value={p.type}
              className={presetItem}
            >
              {p.label} - {p.minutes}min
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>

        <div
          className={cn(
            "rounded-2xl border border-scene-panel-border bg-scene-panel px-6 py-2 font-extrabold leading-none tabular-nums tracking-[2px] backdrop-blur-sm [font-size:clamp(52px,15vw,96px)] [text-shadow:0_2px_14px_rgba(11,21,24,0.35)]",
            running ? "text-scene-accent" : "text-scene-foreground",
          )}
        >
          {formatClock(remaining)}
        </div>

        <div className="flex gap-3">
          {status !== "running" ? (
            <Button variant="scene" size="lg" onClick={start}>
              {status === "done" ? "Recomecar" : "Iniciar"}
            </Button>
          ) : (
            <Button variant="danger" size="lg" onClick={stop}>
              Parar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
