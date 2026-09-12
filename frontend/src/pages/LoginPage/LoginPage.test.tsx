import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

const login = vi.fn();
const register = vi.fn();
vi.mock("../../providers/AuthProvider", () => ({
  useAuth: () => ({ user: null, login, register }),
}));

import { LoginPage } from "./LoginPage";

async function switchToRegister() {
  const user = userEvent.setup();
  await user.click(screen.getByText("Cadastrar"));
}

describe("LoginPage register confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    login.mockResolvedValue(undefined);
    register.mockResolvedValue(undefined);
  });

  it("shows the confirmation field only in register mode", async () => {
    render(<LoginPage />);
    expect(screen.queryByLabelText("Confirmar senha")).not.toBeInTheDocument();

    await switchToRegister();

    expect(screen.getByLabelText("Confirmar senha")).toBeInTheDocument();
  });

  it("blocks registration and shows an error when passwords differ", async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginPage />);
    await switchToRegister();

    await user.type(screen.getByLabelText("E-mail"), "a@b.com");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.type(screen.getByLabelText("Confirmar senha"), "password124");

    fireEvent.submit(container.querySelector("form")!);

    expect(await screen.findByText("As senhas não conferem.")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("registers when the password and confirmation match", async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginPage />);
    await switchToRegister();

    await user.type(screen.getByLabelText("E-mail"), "a@b.com");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.type(screen.getByLabelText("Confirmar senha"), "password123");

    fireEvent.submit(container.querySelector("form")!);

    await vi.waitFor(() =>
      expect(register).toHaveBeenCalledWith("a@b.com", "password123"),
    );
  });
});
