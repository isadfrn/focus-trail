import { useEffect, useRef, useState } from "react";

import { sessionApi } from "../api/session.api";
import { ApiError } from "../errors/api-error";
import { notify } from "../lib/platform";
import { useAuth } from "../providers/AuthProvider";
import { useTimerActivity } from "../providers/TimerActivityProvider";
import { useToast } from "../providers/ToastProvider";
import type { SessionType } from "../types/session";

export type TimerStatus = "idle" | "running" | "done";

export interface Preset {
  type: SessionType;
  label: string;
  minutes: number;
}

/** Fallbacks used before the user loads or when they haven't set a preference. */
export const DEFAULT_FOCUS_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;

/**
 * Timer state machine + session persistence — the business logic behind the
 * Timer page (the frontend's "service"). Keeps the countdown, saves the session
 * on stop/completion, and reports the outcome via toast/notification. The page
 * only renders what this returns.
 */
export function useTimer() {
  const { user } = useAuth();
  const focusMinutes = user?.focusMinutes ?? DEFAULT_FOCUS_MINUTES;
  const breakMinutes = user?.breakMinutes ?? DEFAULT_BREAK_MINUTES;

  const presets: Preset[] = [
    { type: "focus", label: "Foco", minutes: focusMinutes },
    { type: "break", label: "Pausa", minutes: breakMinutes },
  ];

  const [type, setType] = useState<SessionType>("focus");
  const [durationSec, setDurationSec] = useState(focusMinutes * 60);
  const [remaining, setRemaining] = useState(focusMinutes * 60);
  const [status, setStatus] = useState<TimerStatus>("idle");

  const intervalRef = useRef<number | null>(null);
  const startedAtRef = useRef<Date | null>(null);
  const endTargetRef = useRef<number>(0);
  const finishingRef = useRef(false);

  const toast = useToast();
  const { setRunning } = useTimerActivity();

  // Keep the countdown in sync with the user's preferred durations — but only
  // while idle, so we never disturb a running or just-finished session.
  useEffect(() => {
    if (status !== "idle") return;
    const minutes = type === "focus" ? focusMinutes : breakMinutes;
    setDurationSec(minutes * 60);
    setRemaining(minutes * 60);
  }, [focusMinutes, breakMinutes, type, status]);

  const clearTimer = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  useEffect(() => clearTimer, []);

  // Publish the running state app-wide (used to lock the character picker).
  useEffect(() => {
    setRunning(status === "running");
    return () => setRunning(false);
  }, [status, setRunning]);

  const selectPreset = (t: SessionType, minutes: number) => {
    if (status === "running") return;
    setType(t);
    setDurationSec(minutes * 60);
    setRemaining(minutes * 60);
    setStatus("idle");
  };

  const save = async (completed: boolean, endedAt: Date, elapsedSec: number) => {
    const startedAt = startedAtRef.current;
    if (!startedAt || elapsedSec < 1) return;
    try {
      await sessionApi.create({
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationSeconds: Math.min(elapsedSec, durationSec),
        type,
        completed,
      });
      toast(
        completed
          ? "Sessao concluida e salva."
          : "Sessao interrompida - registrada.",
      );
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "erro";
      toast(`Nao consegui salvar a sessao (${code}).`);
    }
  };

  const start = () => {
    if (status === "running") return;
    startedAtRef.current = new Date();
    endTargetRef.current = Date.now() + durationSec * 1000;
    finishingRef.current = false;
    setRemaining(durationSec);
    setStatus("running");
    clearTimer();
    intervalRef.current = window.setInterval(() => {
      const left = Math.max(
        0,
        Math.round((endTargetRef.current - Date.now()) / 1000),
      );
      setRemaining(left);
      if (left <= 0 && !finishingRef.current) {
        finishingRef.current = true;
        clearTimer();
        setStatus("done");
        notify(
          type === "focus" ? "Foco concluido!" : "Pausa concluida!",
          "Sua sessao terminou.",
        );
        void save(true, new Date(), durationSec);
      }
    }, 250);
  };

  const stop = () => {
    if (status !== "running") return;
    clearTimer();
    const endedAt = new Date();
    const startedAt = startedAtRef.current;
    const elapsed = startedAt
      ? Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
      : 0;
    setStatus("idle");
    setRemaining(durationSec);
    void save(false, endedAt, elapsed);
  };

  return {
    type,
    remaining,
    status,
    running: status === "running",
    presets,
    selectPreset,
    start,
    stop,
  };
}
