import * as RadioGroup from "@radix-ui/react-radio-group";

import { useCharacter } from "../../providers/CharacterProvider";
import { useTimerActivity } from "../../providers/TimerActivityProvider";

const itemClass =
  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground cursor-pointer select-none outline-none hover:bg-background data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[disabled]:hover:bg-transparent";

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Scenario chooser rendered inside the app menu. Locked while a timer session
 * is running — the character can't change mid-session.
 */
export function ScenarioRadioGroup() {
  const { character, characters, setCharacterId } = useCharacter();
  const { running } = useTimerActivity();

  return (
    <>
      <RadioGroup.Root
        value={character.id}
        onValueChange={setCharacterId}
        disabled={running}
        aria-label="Cenario"
        className="flex flex-col gap-0.5"
      >
        {characters.map((c) => (
          <RadioGroup.Item key={c.id} value={c.id} className={itemClass}>
            <span className="inline-flex w-3.5 justify-center text-primary">
              <RadioGroup.Indicator>
                <CheckIcon />
              </RadioGroup.Indicator>
            </span>
            {c.name}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
      {running && (
        <p className="px-2.5 pt-1 text-[11px] text-muted">
          Nao da pra trocar de cenario com o timer rodando.
        </p>
      )}
    </>
  );
}
