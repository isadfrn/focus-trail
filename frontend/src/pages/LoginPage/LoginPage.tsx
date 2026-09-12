import * as Label from "@radix-ui/react-label";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import logo from "../../assets/logo.png";
import { ApiError } from "../../errors/api-error";
import { authErrorMessage } from "../../errors/messages";
import { Button } from "../../components/Button/Button";
import { registerPasswordError } from "../../lib/credentials";
import { useAuth } from "../../providers/AuthProvider";

type Mode = "login" | "register";

const fieldInput =
  "rounded-[10px] border border-border bg-background px-3 py-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

const segItem =
  "rounded-lg py-2 text-sm text-muted cursor-pointer outline-none transition-colors data-[state=on]:bg-surface data-[state=on]:font-medium data-[state=on]:text-foreground data-[state=on]:shadow-sm";

export function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register") {
      const validationError = registerPasswordError(password, confirmPassword);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "unknown";
      setError(authErrorMessage(code));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <form
        onSubmit={submit}
        className="flex w-full max-w-[360px] flex-col gap-3.5 rounded-2xl border border-border bg-surface p-7 shadow-app max-sm:p-[22px]"
      >
        <img
          src={logo}
          alt="Focus Trail"
          className="mx-auto h-20 w-auto max-sm:h-16"
        />
        <h1 className="sr-only">Focus Trail</h1>

        <ToggleGroup.Root
          type="single"
          value={mode}
          onValueChange={(v) => {
            if (!v) return;
            setMode(v as Mode);
            setError(null);
            setConfirmPassword("");
          }}
          className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1"
        >
          <ToggleGroup.Item value="login" className={segItem}>
            Entrar
          </ToggleGroup.Item>
          <ToggleGroup.Item value="register" className={segItem}>
            Cadastrar
          </ToggleGroup.Item>
        </ToggleGroup.Root>

        <div className="flex flex-col gap-1.5 text-sm">
          <Label.Root htmlFor="email">E-mail</Label.Root>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldInput}
          />
        </div>

        <div className="flex flex-col gap-1.5 text-sm">
          <Label.Root htmlFor="password">Senha</Label.Root>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldInput}
          />
        </div>

        {mode === "register" && (
          <div className="flex flex-col gap-1.5 text-sm">
            <Label.Root htmlFor="confirm-password">Confirmar senha</Label.Root>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={fieldInput}
            />
          </div>
        )}

        {error && <div className="text-sm text-danger">{error}</div>}

        <Button
          variant="primary"
          type="submit"
          disabled={busy}
          className="w-full"
        >
          {busy ? "..." : mode === "login" ? "Entrar" : "Cadastrar"}
        </Button>
      </form>
    </div>
  );
}
