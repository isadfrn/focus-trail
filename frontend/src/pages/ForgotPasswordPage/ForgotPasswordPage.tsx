import * as Label from "@radix-ui/react-label";
import { useState, type FormEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
    try {
      await authApi.forgotPassword(email);
    } catch {
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
      setError(t("forgot.codeRequired"));
      return;
    }

    setBusy(true);
    try {
      await authApi.resetPassword(email, code, newPassword);
      setStep("done");
    } catch {
      setError(t("forgot.invalidCode"));
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
            {t("forgot.done")}
          </p>
          <Button variant="primary" asChild className="w-full">
            <Link to="/login">{t("forgot.goToLogin")}</Link>
          </Button>
        </div>
      ) : step === "request" ? (
        <form onSubmit={requestCode} className={card}>
          <img
            src={logo}
            alt="Focus Trail"
            className="mx-auto h-20 w-auto max-sm:h-16"
          />
          <h1 className="sr-only">{t("forgot.title")}</h1>
          <p className="text-center text-sm text-muted">
            {t("forgot.requestInstructions")}
          </p>

          <div className="flex flex-col gap-1.5 text-sm">
            <Label.Root htmlFor="email">{t("auth.fields.email")}</Label.Root>
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
            {busy ? "..." : t("forgot.sendCode")}
          </Button>
          <Link
            to="/login"
            className="text-center text-sm text-primary no-underline hover:underline"
          >
            {t("forgot.backToLogin")}
          </Link>
        </form>
      ) : (
        <form onSubmit={submitReset} className={card}>
          <img
            src={logo}
            alt="Focus Trail"
            className="mx-auto h-20 w-auto max-sm:h-16"
          />
          <h1 className="sr-only">{t("forgot.resetTitle")}</h1>
          <p className="text-center text-sm text-muted">
            <Trans
              i18nKey="forgot.resetInstructions"
              values={{ email }}
              components={{ strong: <strong /> }}
            />
          </p>

          <div className="flex flex-col gap-1.5 text-sm">
            <Label.Root htmlFor="code">{t("forgot.codeLabel")}</Label.Root>
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
            <Label.Root htmlFor="new-password">{t("forgot.newPassword")}</Label.Root>
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
              {t("forgot.passwordHint")}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <Label.Root htmlFor="confirm">{t("forgot.confirmNewPassword")}</Label.Root>
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
            {busy ? "..." : t("forgot.resetSubmit")}
          </Button>
          <Link
            to="/login"
            className="text-center text-sm text-primary no-underline hover:underline"
          >
            {t("forgot.backToLogin")}
          </Link>
        </form>
      )}
    </div>
  );
}
