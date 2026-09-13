import * as Label from "@radix-ui/react-label";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../../assets/logo.png";
import { authApi } from "../../api/auth.api";
import { Button } from "../../components/Button/Button";
import { registerPasswordError } from "../../lib/credentials";
import { useAuth } from "../../providers/AuthProvider";

type Step = "request" | "reset" | "done";

const card =
  "flex w-full max-w-[360px] flex-col gap-3.5 rounded-2xl border border-border bg-surface p-7 shadow-app max-sm:p-[22px]";

const fieldInput =
  "rounded-[10px] border border-border bg-background px-3 py-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

export function ForgotPasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const requestCode = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // Always advances — the API never reveals whether the account exists.
    try {
      await authApi.forgotPassword(email);
    } catch {
      /* ignore */
    }
    setBusy(false);
    setStep("reset");
  };

  const submitReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = registerPasswordError(newPassword, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (code.length !== 6) {
      setError("Informe o código de 6 dígitos.");
      return;
    }

    setBusy(true);
    try {
      await authApi.resetPassword(email, code, newPassword);
      setStep("done");
    } catch {
      setError("Código inválido ou expirado. Peça um novo e tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center py-4">
      {step === "done" ? (
        <div className={card}>
          <img
            src={logo}
            alt="Focus Trail"
            className="mx-auto h-20 w-auto max-sm:h-16"
          />
          <p className="text-center text-sm text-foreground">
            Senha redefinida com sucesso.
          </p>
          <Button variant="primary" asChild className="w-full">
            <Link to="/login">Ir para o login</Link>
          </Button>
        </div>
      ) : step === "request" ? (
        <form onSubmit={requestCode} className={card}>
          <img
            src={logo}
            alt="Focus Trail"
            className="mx-auto h-20 w-auto max-sm:h-16"
          />
          <h1 className="sr-only">Recuperar senha</h1>
          <p className="text-center text-sm text-muted">
            Informe seu e-mail e enviaremos um código para redefinir a senha.
          </p>

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

          <Button
            variant="primary"
            type="submit"
            disabled={busy}
            className="w-full"
          >
            {busy ? "..." : "Enviar código"}
          </Button>
          <Link
            to="/login"
            className="text-center text-sm text-primary no-underline hover:underline"
          >
            Voltar ao login
          </Link>
        </form>
      ) : (
        <form onSubmit={submitReset} className={card}>
          <img
            src={logo}
            alt="Focus Trail"
            className="mx-auto h-20 w-auto max-sm:h-16"
          />
          <h1 className="sr-only">Redefinir senha</h1>
          <p className="text-center text-sm text-muted">
            Se houver uma conta para <strong>{email}</strong>, enviamos um
            código. Informe-o com a nova senha.
          </p>

          <div className="flex flex-col gap-1.5 text-sm">
            <Label.Root htmlFor="code">Código de 6 dígitos</Label.Root>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className={`${fieldInput} text-center text-lg tracking-[6px]`}
            />
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <Label.Root htmlFor="new-password">Nova senha</Label.Root>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={fieldInput}
            />
            <span className="text-xs text-muted">
              Ao menos 10 caracteres, com letra e número.
            </span>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <Label.Root htmlFor="confirm">Confirmar nova senha</Label.Root>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={fieldInput}
            />
          </div>

          {error && <div className="text-sm text-danger">{error}</div>}

          <Button
            variant="primary"
            type="submit"
            disabled={busy}
            className="w-full"
          >
            {busy ? "..." : "Redefinir senha"}
          </Button>
          <Link
            to="/login"
            className="text-center text-sm text-primary no-underline hover:underline"
          >
            Voltar ao login
          </Link>
        </form>
      )}
    </div>
  );
}
