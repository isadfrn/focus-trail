import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import i18n from "../../i18n";
import { localeStorageKey } from "../../lib/locale";
import { LanguageSelect } from "./LanguageSelect";

describe("LanguageSelect", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("lists every supported language by its native name", () => {
    render(<LanguageSelect />);
    const options = screen
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toEqual(["Português", "English", "Español"]);
  });

  it("selects the active language", async () => {
    await i18n.changeLanguage("es");
    render(<LanguageSelect />);
    expect(screen.getByRole("combobox", { name: "Idioma" })).toHaveValue("es");
  });

  it("falls back to the default language when the active one is unsupported", async () => {
    await i18n.changeLanguage("fr");
    render(<LanguageSelect />);
    expect(screen.getByRole("combobox", { name: "Idioma" })).toHaveValue("pt");
  });

  it("switches the interface language and persists the choice", async () => {
    render(<LanguageSelect />);
    fireEvent.change(screen.getByRole("combobox", { name: "Idioma" }), {
      target: { value: "en" },
    });

    const select = await screen.findByRole("combobox", { name: "Language" });
    expect(select).toHaveValue("en");
    expect(localStorage.getItem(localeStorageKey)).toBe("en");
  });
});
