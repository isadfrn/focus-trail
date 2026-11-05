import { afterEach, describe, expect, it } from "vitest";

import i18n from "../i18n";
import { scenarioName } from "./scenario-name";

describe("scenarioName", () => {
  afterEach(async () => {
    await i18n.changeLanguage("pt");
  });

  it("translates a scenario by its id", async () => {
    const scenario = { id: "female-japanese-student", name: "Fallback" };

    expect(scenarioName(scenario)).toBe("Estudante japonesa");

    await i18n.changeLanguage("en");
    expect(scenarioName(scenario)).toBe("Japanese student");

    await i18n.changeLanguage("es");
    expect(scenarioName(scenario)).toBe("Estudiante japonesa");
  });

  it("falls back to the name from scenarios.json when there is no translation", async () => {
    await i18n.changeLanguage("en");

    expect(scenarioName({ id: "new-scenario", name: "Novo cenário" })).toBe(
      "Novo cenário",
    );
  });
});
