import i18next from "../i18n";

interface NamedScenario {
  id: string;
  name: string;
}

export function scenarioName(scenario: NamedScenario): string {
  const translated: unknown = i18next.getResource(
    i18next.language,
    "translation",
    `scenarios.${scenario.id}`,
  );
  return typeof translated === "string" ? translated : scenario.name;
}
