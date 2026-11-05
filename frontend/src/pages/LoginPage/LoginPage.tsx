import * as Label from "@radix-ui/react-label";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useState, type FormEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import logo from "../../assets/logo.png";
import { authApi } from "../../api/auth.api";
import { ApiError } from "../../errors/api-error";
import { authErrorMessage } from "../../errors/messages";
import { Button } from "../../components/Button/Button";
import { registerPasswordError } from "../../lib/credentials";
import { useAuth } from "../../providers/AuthProvider";

type Mode = "login" | "register";
type Screen = "auth" | "verify";

const card =
  "flex w-full max-w-[360px] flex-col gap-3.5 rounded-2xl border border-border bg-surface p-7 shadow-app max-sm:p-[22px]";

const fieldInput =
  "rounded-[10px] border border-border bg-background px-3 py-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

const segItem =
  "rounded-lg py-2 text-sm text-muted cursor-pointer outline-none transition-colors data-[state=on]:bg-surface data-[state=on]:font-medium data-[state=on]:text-foreground data-[state=on]:shadow-sm";

export function LoginPage() {
  const { t } = useTranslation();
  const { user, login, register, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("auth");
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const goVerify = (forEmail: string) => {
    setPendingEmail(forEmail);
    setCode("");
    setError(null);
    setInfo(t("auth.verify.codeSent"));
    setScreen("verify");
  };

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
      if (mode === "login") {
        await login(email, password);
        navigate("/", { replace: true });
      } else {
        const result = await register(email, password);
        if ("verificationRequired" in result) {
          goVerify(result.email);
          return;
        }
        navigate("/", { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        goVerify(email);
        return;
      }
      const errorCode = err instanceof ApiError ? err.code : "unknown";
      setError(authErrorMessage(errorCode));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await verifyEmail(pendingEmail, code);
      navigate("/", { replace: true });
    } catch {
      setError(t("auth.verify.invalidCode"));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await authApi.resendVerification(pendingEmail);
    } catch {
    }
    setInfo(t("auth.verify.resent"));
  };

  if (screen === "verify") {
    return (
      <div className="flex min-h-full items-center justify-center py-4">
        <form onSubmit={submitCode} className={card}>
          <img
            src={logo}
            alt="Focus Trail"
            className="mx-auto h-20 w-auto max-sm:h-16"
          />
          <h1 className="sr-only">{t("auth.verify.title")}</h1>
          <p className="text-center text-sm text-muted">
            <Trans
              i18nKey="auth.verify.instructions"
              values={{ email: pendingEmail }}
              components={{ strong: <strong /> }}
            />
          </p>

          <div className="flex flex-col gap-1.5 text-sm">
            <Label.Root htmlFor="code">{t("auth.verify.codeLabel")}</Label.Root>
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

          {info && <div className="text-sm text-muted">{info}</div>}
          {error && <div className="text-sm text-danger">{error}</div>}

          <Button
            variant="primary"
            type="submit"
            disabled={busy || code.length !== 6}
            className="w-full"
          >
            {busy ? "..." : t("auth.verify.confirm")}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Button variant="link" type="button" onClick={resend}>
              {t("auth.verify.resend")}
            </Button>
            <Button
              variant="link"
              type="button"
              onClick={() => {
                setScreen("auth");
                setError(null);
                setInfo(null);
              }}
            >
              {t("auth.verify.back")}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center py-4">
      <form onSubmit={submit} className={card}>
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
            {t("auth.tabs.login")}
          </ToggleGroup.Item>
          <ToggleGroup.Item value="register" className={segItem}>
            {t("auth.tabs.register")}
          </ToggleGroup.Item>
        </ToggleGroup.Root>

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

        <div className="flex flex-col gap-1.5 text-sm">
          <Label.Root htmlFor="password">{t("auth.fields.password")}</Label.Root>
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
            <Label.Root htmlFor="confirm-password">
              {t("auth.fields.confirmPassword")}
            </Label.Root>
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
          {busy ? "..." : t(mode === "login" ? "auth.tabs.login" : "auth.tabs.register")}
        </Button>

        {mode === "login" && (
          <Link
            to="/forgot-password"
            className="text-center text-sm text-primary no-underline hover:underline"
          >
            {t("auth.forgotLink")}
          </Link>
        )}
      </form>
    </div>
  );
}
