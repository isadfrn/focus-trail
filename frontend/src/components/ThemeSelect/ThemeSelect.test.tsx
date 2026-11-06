import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { themeStorageKey } from "../../lib/theme";
import { ThemeProvider } from "../../providers/ThemeProvider";
import { ThemeSelect } from "./ThemeSelect";

function renderThemeSelect() {
  return render(
    <ThemeProvider>
      <ThemeSelect />
    </ThemeProvider>,
  );
}

describe("ThemeSelect", () => {
  afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("lists the light and dark themes by their translated names", () => {
    renderThemeSelect();
    const options = screen
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toEqual(["Claro", "Escuro"]);
  });

  it("selects the light theme by default", () => {
    renderThemeSelect();
    expect(screen.getByRole("combobox", { name: "Tema" })).toHaveValue("light");
  });

  it("switches the theme and persists the choice", () => {
    renderThemeSelect();
    fireEvent.change(screen.getByRole("combobox", { name: "Tema" }), {
      target: { value: "dark" },
    });

    expect(screen.getByRole("combobox", { name: "Tema" })).toHaveValue("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(themeStorageKey)).toBe("dark");
  });
});
