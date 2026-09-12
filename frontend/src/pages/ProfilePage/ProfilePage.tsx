import * as Label from "@radix-ui/react-label";
import { useState, type FormEvent } from "react";

import { authApi } from "../../api/auth.api";
import { Button } from "../../components/Button/Button";
import { ApiError } from "../../errors/api-error";
import {
  DEFAULT_BREAK_MINUTES,
  DEFAULT_FOCUS_MINUTES,
} from "../../hooks/useTimer";
import { useAuth } from "../../providers/AuthProvider";
import { useCharacter } from "../../providers/CharacterProvider";
import { useToast } from "../../providers/ToastProvider";

const card =
  "flex flex-col gap-3.5 rounded-2xl border border-border bg-surface p-6 shadow-app max-sm:p-[18px]";

const field =
  "rounded-[10px] border border-border bg-background px-3 py-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

function passwordErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Senha atual incorreta.";
    if (err.status === 400)
      return "A nova senha precisa ter ao menos 10 caracteres, com letra e número.";
  }
  return "Não consegui trocar a senha. Tente de novo.";
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { characters, setCharacterId } = useCharacter();
  const toast = useToast();

  const [sceneId, setSceneId] = useState(
    () => user?.character ?? characters[0]?.id ?? "",
  );
  // Guardados como string para o campo poder ficar vazio ao editar (sem forçar
  // um "0"); são convertidos e validados só no submit.
  const [focusInput, setFocusInput] = useState(
    () => String(user?.focusMinutes ?? DEFAULT_FOCUS_MINUTES),
  );
  const [breakInput, setBreakInput] = useState(
    () => String(user?.breakMinutes ?? DEFAULT_BREAK_MINUTES),
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return null;

  const savePreferences = async (e: FormEvent) => {
    e.preventDefault();
    if (savingPrefs) return;

    const focus = Number(focusInput);
    const brk = Number(breakInput);
    if (!Number.isInteger(focus) || focus < 1 || focus > 180) {
      toast("Foco deve ser um número inteiro entre 1 e 180 minutos.");
      return;
    }
    if (!Number.isInteger(brk) || brk < 1 || brk > 60) {
      toast("Pausa deve ser um número inteiro entre 1 e 60 minutos.");
      return;
    }

    setSavingPrefs(true);
    try {
      const { user: updated } = await authApi.updatePreferences({
        character: sceneId,
        focusMinutes: focus,
        breakMinutes: brk,
      });
      updateUser(updated);
      setCharacterId(updated.character);
      toast("Preferências salvas.");
    } catch {
      toast("Não consegui salvar as preferências. Tente de novo.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (savingPassword) return;
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("A confirmação não bate com a nova senha.");
      return;
    }
    if (newPassword.length < 10) {
      setPasswordError("A nova senha precisa ter ao menos 10 caracteres.");
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Senha atualizada.");
    } catch (err) {
      setPasswordError(passwordErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0 mb-1 text-2xl font-bold">Perfil</h1>
        <p className="text-muted">{user.email}</p>
      </div>

      <form onSubmit={savePreferences} className={card}>
        <h2 className="m-0 text-lg font-semibold">Preferências</h2>

        <div className="flex flex-col gap-1.5 text-sm">
          <Label.Root htmlFor="scene">Cenário padrão</Label.Root>
          <select
            id="scene"
            value={sceneId}
            onChange={(e) => setSceneId(e.target.value)}
            className={field}
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <div className="flex flex-col gap-1.5 text-sm">
            <Label.Root htmlFor="focus">Foco (minutos)</Label.Root>
            <input
              id="focus"
              type="number"
              inputMode="numeric"
              min={1}
              max={180}
              required
              value={focusInput}
              onChange={(e) => setFocusInput(e.target.value)}
              className={field}
            />
          </div>
          <div className="flex flex-col gap-1.5 text-sm">
            <Label.Root htmlFor="break">Pausa (minutos)</Label.Root>
            <input
              id="break"
              type="number"
              inputMode="numeric"
              min={1}
              max={60}
              required
              value={breakInput}
              onChange={(e) => setBreakInput(e.target.value)}
              className={field}
            />
          </div>
        </div>

        <Button
          variant="primary"
          type="submit"
          disabled={savingPrefs}
          className="self-start"
        >
          {savingPrefs ? "Salvando..." : "Salvar preferências"}
        </Button>
      </form>

      <form onSubmit={changePassword} className={card}>
        <h2 className="m-0 text-lg font-semibold">Trocar senha</h2>

        <div className="flex flex-col gap-1.5 text-sm">
          <Label.Root htmlFor="current-password">Senha atual</Label.Root>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={field}
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
            className={field}
          />
          <span className="text-xs text-muted">
            Ao menos 10 caracteres, com letra e número.
          </span>
        </div>

        <div className="flex flex-col gap-1.5 text-sm">
          <Label.Root htmlFor="confirm-password">Confirmar nova senha</Label.Root>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={field}
          />
        </div>

        {passwordError && (
          <div className="text-sm text-danger">{passwordError}</div>
        )}

        <Button
          variant="primary"
          type="submit"
          disabled={savingPassword}
          className="self-start"
        >
          {savingPassword ? "Salvando..." : "Trocar senha"}
        </Button>
      </form>
    </div>
  );
}
