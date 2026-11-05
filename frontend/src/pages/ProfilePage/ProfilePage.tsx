import * as Label from "@radix-ui/react-label";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { authApi } from "../../api/auth.api";
import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { ApiError } from "../../errors/api-error";
import i18next from "../../i18n";
import {
  DEFAULT_BREAK_MINUTES,
  DEFAULT_FOCUS_MINUTES,
  DEFAULT_LONG_BREAK_MINUTES,
  DEFAULT_POMODOROS_UNTIL_LONG_BREAK,
} from "../../hooks/useTimer";
import { scenarioName } from "../../lib/scenario-name";
import { useAuth } from "../../providers/AuthProvider";
import { useCharacter } from "../../providers/CharacterProvider";
import { useToast } from "../../providers/ToastProvider";

const card =
  "flex flex-col gap-3.5 rounded-2xl border border-border bg-surface p-6 shadow-app max-sm:p-[18px]";

const field =
  "rounded-[10px] border border-border bg-background px-3 py-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

function passwordErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return i18next.t("profile.password.wrongCurrent");
    if (err.status === 400) return i18next.t("profile.password.invalidNew");
  }
  return i18next.t("profile.password.failed");
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
  const { t } = useTranslation();
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
      toast(t("profile.privacy.exported"));
    } catch {
      toast(t("profile.privacy.exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  const requestDelete = () => {
    setDeleteError(null);
    if (deletePassword.length === 0) {
      setDeleteError(t("profile.privacy.passwordRequired"));
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
      toast(t("profile.privacy.deleted"));
      await logout();
    } catch (err) {
      setConfirmingDelete(false);
      setDeleteError(
        err instanceof ApiError && err.status === 401
          ? t("profile.privacy.wrongPassword")
          : t("profile.privacy.deleteFailed"),
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
      toast(t("profile.preferences.errors.focus", { min: 1, max: 180 }));
      return;
    }
    if (!Number.isInteger(brk) || brk < 1 || brk > 60) {
      toast(t("profile.preferences.errors.break", { min: 1, max: 60 }));
      return;
    }
    const longBreak = Number(longBreakInput);
    const pomodoros = Number(pomodorosInput);
    if (!Number.isInteger(longBreak) || longBreak < 1 || longBreak > 60) {
      toast(t("profile.preferences.errors.longBreak", { min: 1, max: 60 }));
      return;
    }
    if (!Number.isInteger(pomodoros) || pomodoros < 1 || pomodoros > 12) {
      toast(t("profile.preferences.errors.cycles", { min: 1, max: 12 }));
      return;
    }
    const goal = Number(goalInput);
    if (!Number.isInteger(goal) || goal < 0 || goal > 1440) {
      toast(t("profile.preferences.errors.goal", { min: 0, max: 1440 }));
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
      toast(t("profile.preferences.saved"));
    } catch {
      toast(t("profile.preferences.saveFailed"));
    } finally {
      setSavingPrefs(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (savingPassword) return;
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError(t("profile.password.mismatch"));
      return;
    }
    if (newPassword.length < 10) {
      setPasswordError(t("profile.password.tooShort"));
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast(t("profile.password.updated"));
    } catch (err) {
      setPasswordError(passwordErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0 mb-1 text-2xl font-bold">{t("profile.title")}</h1>
        <p className="text-muted">{user.email}</p>
      </div>

      <form onSubmit={savePreferences} className={card}>
        <h2 className="m-0 text-lg font-semibold">
          {t("profile.preferences.title")}
        </h2>

        <div className="flex flex-col gap-1.5 text-sm">
          <Label.Root htmlFor="scene">
            {t("profile.preferences.defaultScene")}
          </Label.Root>
          <select
            id="scene"
            value={sceneId}
            onChange={(e) => setSceneId(e.target.value)}
            className={field}
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {scenarioName(c)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <div className="flex flex-col gap-1.5 text-sm">
            <Label.Root htmlFor="focus">
              {t("profile.preferences.focusMinutes")}
            </Label.Root>
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
            <Label.Root htmlFor="break">
              {t("profile.preferences.breakMinutes")}
            </Label.Root>
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
            {t("profile.preferences.dailyGoal")}
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
          {t("profile.preferences.autoCycle")}
        </label>

        {autoCycle && (
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <div className="flex flex-col gap-1.5 text-sm">
              <Label.Root htmlFor="long-break">
                {t("profile.preferences.longBreakMinutes")}
              </Label.Root>
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
              <Label.Root htmlFor="pomodoros">
                {t("profile.preferences.cyclesUntilLongBreak")}
              </Label.Root>
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
          {savingPrefs
            ? t("profile.preferences.saving")
            : t("profile.preferences.save")}
        </Button>
      </form>

      <form onSubmit={changePassword} className={card}>
        <h2 className="m-0 text-lg font-semibold">
          {t("profile.password.title")}
        </h2>

        <div className="flex flex-col gap-1.5 text-sm">
          <Label.Root htmlFor="current-password">
            {t("profile.password.currentPassword")}
          </Label.Root>
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
          <Label.Root htmlFor="new-password">
            {t("profile.password.newPassword")}
          </Label.Root>
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
            {t("profile.password.hint")}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 text-sm">
          <Label.Root htmlFor="confirm-password">
            {t("profile.password.confirmPassword")}
          </Label.Root>
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
          {savingPassword
            ? t("profile.password.saving")
            : t("profile.password.submit")}
        </Button>
      </form>

      <section className={card}>
        <h2 className="m-0 text-lg font-semibold">
          {t("profile.privacy.title")}
        </h2>
        <p className="text-sm text-muted">
          {t("profile.privacy.description")}
        </p>

        <Button
          type="button"
          disabled={exporting}
          className="self-start"
          onClick={exportData}
        >
          {exporting
            ? t("profile.privacy.exporting")
            : t("profile.privacy.export")}
        </Button>

        <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
          <h3 className="m-0 text-sm font-semibold text-danger">
            {t("profile.privacy.deleteTitle")}
          </h3>
          <p className="text-sm text-muted">
            {t("profile.privacy.deleteDescription")}
          </p>
          <div className="flex flex-col gap-1.5 text-sm">
            <Label.Root htmlFor="delete-password">
              {t("profile.privacy.passwordLabel")}
            </Label.Root>
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
            {t("profile.privacy.deleteButton")}
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) setConfirmingDelete(false);
        }}
        title={t("profile.privacy.deleteTitle")}
        description={t("profile.privacy.confirmDescription")}
        confirmLabel={t("profile.privacy.confirmLabel")}
        busy={deleting}
        onConfirm={deleteAccount}
      />
    </div>
  );
}
