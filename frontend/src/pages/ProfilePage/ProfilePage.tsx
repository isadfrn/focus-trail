import * as Label from "@radix-ui/react-label";
import { useState, type FormEvent } from "react";

import { authApi } from "../../api/auth.api";
import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { ApiError } from "../../errors/api-error";
import {
  DEFAULT_BREAK_MINUTES,
  DEFAULT_FOCUS_MINUTES,
  DEFAULT_LONG_BREAK_MINUTES,
  DEFAULT_POMODOROS_UNTIL_LONG_BREAK,
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

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { characters, setCharacterId } = useCharacter();
  const toast = useToast();

  const [sceneId, setSceneId] = useState(
    () => user?.character ?? characters[0]?.id ?? "",
  );
  const [focusInput, setFocusInput] = useState(
    () => String(user?.focusMinutes ?? DEFAULT_FOCUS_MINUTES),
  );
  const [breakInput, setBreakInput] = useState(
    () => String(user?.breakMinutes ?? DEFAULT_BREAK_MINUTES),
  );
  const [goalInput, setGoalInput] = useState(
    () => String(user?.dailyFocusGoalMinutes ?? 0),
  );
  const [autoCycle, setAutoCycle] = useState(() => user?.autoCycle ?? false);
  const [longBreakInput, setLongBreakInput] = useState(
    () => String(user?.longBreakMinutes ?? DEFAULT_LONG_BREAK_MINUTES),
  );
  const [pomodorosInput, setPomodorosInput] = useState(
    () =>
      String(user?.pomodorosUntilLongBreak ?? DEFAULT_POMODOROS_UNTIL_LONG_BREAK),
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!user) return null;

  const exportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await authApi.exportData();
      downloadJson("focus-trail-export.json", data);
      toast("Seus dados foram exportados.");
    } catch {
      toast("Não consegui exportar seus dados. Tente de novo.");
    } finally {
      setExporting(false);
    }
  };

  const requestDelete = () => {
    setDeleteError(null);
    if (deletePassword.length === 0) {
      setDeleteError("Digite sua senha para confirmar.");
      return;
    }
    setConfirmingDelete(true);
  };

  const deleteAccount = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await authApi.deleteAccount(deletePassword);
      setConfirmingDelete(false);
      toast("Sua conta foi excluída.");
      await logout();
    } catch (err) {
      setConfirmingDelete(false);
      setDeleteError(
        err instanceof ApiError && err.status === 401
          ? "Senha incorreta."
          : "Não consegui excluir a conta. Tente de novo.",
      );
    } finally {
      setDeleting(false);
    }
  };

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
    const longBreak = Number(longBreakInput);
    const pomodoros = Number(pomodorosInput);
    if (!Number.isInteger(longBreak) || longBreak < 1 || longBreak > 60) {
      toast("Pausa longa deve ser um número inteiro entre 1 e 60 minutos.");
      return;
    }
    if (!Number.isInteger(pomodoros) || pomodoros < 1 || pomodoros > 12) {
      toast("Ciclos até a pausa longa deve ser entre 1 e 12.");
      return;
    }
    const goal = Number(goalInput);
    if (!Number.isInteger(goal) || goal < 0 || goal > 1440) {
      toast("Meta diária deve ser um número inteiro entre 0 e 1440 minutos.");
      return;
    }

    setSavingPrefs(true);
    try {
      const { user: updated } = await authApi.updatePreferences({
        character: sceneId,
        focusMinutes: focus,
        breakMinutes: brk,
        autoCycle,
        longBreakMinutes: longBreak,
        pomodorosUntilLongBreak: pomodoros,
        dailyFocusGoalMinutes: goal,
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

        <div className="flex flex-col gap-1.5 text-sm">
          <Label.Root htmlFor="daily-goal">
            Meta diária de foco (minutos, 0 = sem meta)
          </Label.Root>
          <input
            id="daily-goal"
            type="number"
            inputMode="numeric"
            min={0}
            max={1440}
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            className={field}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoCycle}
            onChange={(e) => setAutoCycle(e.target.checked)}
            className="size-4 cursor-pointer accent-primary"
          />
          Encadear sessões automaticamente (foco → pausa → foco)
        </label>

        {autoCycle && (
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <div className="flex flex-col gap-1.5 text-sm">
              <Label.Root htmlFor="long-break">Pausa longa (minutos)</Label.Root>
              <input
                id="long-break"
                type="number"
                inputMode="numeric"
                min={1}
                max={60}
                value={longBreakInput}
                onChange={(e) => setLongBreakInput(e.target.value)}
                className={field}
              />
            </div>
            <div className="flex flex-col gap-1.5 text-sm">
              <Label.Root htmlFor="pomodoros">Ciclos até a pausa longa</Label.Root>
              <input
                id="pomodoros"
                type="number"
                inputMode="numeric"
                min={1}
                max={12}
                value={pomodorosInput}
                onChange={(e) => setPomodorosInput(e.target.value)}
                className={field}
              />
            </div>
          </div>
        )}

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

      <section className={card}>
        <h2 className="m-0 text-lg font-semibold">Privacidade e dados</h2>
        <p className="text-sm text-muted">
          Baixe uma cópia de todos os seus dados ou exclua sua conta
          permanentemente.
        </p>

        <Button
          type="button"
          disabled={exporting}
          className="self-start"
          onClick={exportData}
        >
          {exporting ? "Exportando..." : "Exportar meus dados"}
        </Button>

        <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
          <h3 className="m-0 text-sm font-semibold text-danger">Excluir conta</h3>
          <p className="text-sm text-muted">
            Esta ação é permanente e apaga sua conta e todo o seu histórico.
            Digite sua senha para confirmar.
          </p>
          <div className="flex flex-col gap-1.5 text-sm">
            <Label.Root htmlFor="delete-password">Senha</Label.Root>
            <input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className={field}
            />
          </div>
          {deleteError && (
            <div className="text-sm text-danger">{deleteError}</div>
          )}
          <Button
            variant="danger"
            type="button"
            disabled={deleting}
            className="self-start"
            onClick={requestDelete}
          >
            Excluir minha conta
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) setConfirmingDelete(false);
        }}
        title="Excluir conta"
        description="Sua conta e todo o histórico serão apagados para sempre. Essa ação não pode ser desfeita."
        confirmLabel="Excluir para sempre"
        busy={deleting}
        onConfirm={deleteAccount}
      />
    </div>
  );
}
