import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "../../i18n";
import { LoginPage } from "./LoginPage";

vi.mock("../../providers/AuthProvider", () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    register: vi.fn(),
    verifyEmail: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage language", () => {
  afterEach(async () => {
    await i18n.changeLanguage("pt");
  });

  it("renders in Portuguese by default", () => {
    renderPage();

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByText("Esqueci minha senha")).toBeInTheDocument();
  });

  it("re-renders in English when the language changes", async () => {
    renderPage();

    await act(async () => {
      await i18n.changeLanguage("en");
    });

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("Forgot my password")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Sign up" })).toBeInTheDocument();
  });

  it("renders in Spanish", async () => {
    await i18n.changeLanguage("es");
    renderPage();

    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByText("Olvidé mi contraseña")).toBeInTheDocument();
  });
});
