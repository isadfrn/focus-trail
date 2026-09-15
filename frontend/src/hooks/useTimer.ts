import { useCallback, useEffect, useRef, useState } from "react";

import { sessionApi } from "../api/session.api";
import { ApiError } from "../errors/api-error";
import { playSessionChime } from "../lib/chime";
import { notify } from "../lib/platform";
import {
  nextPhase,
  phaseMinutes,
  phaseType,
  type Phase,
} from "../lib/pomodoro-cycle";
import {
  clearActiveSession,
  loadActiveSession,
  remainingSeconds,
  saveActiveSession,
} from "../lib/timer-persistence";
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

export const DEFAULT_FOCUS_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;
export const DEFAULT_LONG_BREAK_MINUTES = 15;
export const DEFAULT_POMODOROS_UNTIL_LONG_BREAK = 4;

interface RunningSession {
  phase: Phase;
  type: SessionType;
  durationSec: number;
  startedAt: Date;
}

export function useTimer() {
  const { user } = useAuth();
  const focusMinutes = user?.focusMinutes ?? DEFAULT_FOCUS_MINUTES;
  const breakMinutes = user?.breakMinutes ?? DEFAULT_BREAK_MINUTES;
  const longBreakMinutes = user?.longBreakMinutes ?? DEFAULT_LONG_BREAK_MINUTES;
  const pomodorosUntilLongBreak =
    user?.pomodorosUntilLongBreak ?? DEFAULT_POMODOROS_UNTIL_LONG_BREAK;
  const autoCycle = user?.autoCycle ?? false;

  const presets: Preset[] = [
    { type: "focus", label: "Foco", minutes: focusMinutes },
    { type: "break", label: "Pausa", minutes: breakMinutes },
  ];

  const [phase, setPhase] = useState<Phase>("focus");
  const [durationSec, setDurationSec] = useState(focusMinutes * 60);
  const [remaining, setRemaining] = useState(focusMinutes * 60);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [taskLabel, setTaskLabel] = useState("");

  const type = phaseType(phase);

  const intervalRef = useRef<number | null>(null);
  const runningRef = useRef<RunningSession | null>(null);
  const finishingRef = useRef(false);
  const endTargetRef = useRef(0);
  const completedFocusRef = useRef(0);

  const configRef = useRef({
    focusMinutes,
    breakMinutes,
    longBreakMinutes,
    pomodorosUntilLongBreak,
    autoCycle,
  });
  useEffect(() => {
    configRef.current = {
      focusMinutes,
      breakMinutes,
      longBreakMinutes,
      pomodorosUntilLongBreak,
      autoCycle,
    };
  }, [
    focusMinutes,
    breakMinutes,
    longBreakMinutes,
    pomodorosUntilLongBreak,
    autoCycle,
  ]);

  const taskLabelRef = useRef(taskLabel);
  useEffect(() => {
    taskLabelRef.current = taskLabel;
  }, [taskLabel]);

  const toast = useToast();
  const { setRunning } = useTimerActivity();

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    setRunning(status === "running");
    return () => setRunning(false);
  }, [status, setRunning]);

  useEffect(() => {
    if (status !== "idle") return;
    const minutes = phaseMinutes(phase, configRef.current);
    setDurationSec(minutes * 60);
    setRemaining(minutes * 60);
  }, [phase, focusMinutes, breakMinutes, longBreakMinutes, status]);

  const save = useCallback(
    async (
      session: RunningSession,
      completed: boolean,
      endedAt: Date,
      elapsedSec: number,
    ) => {
      if (elapsedSec < 1) return;
      const trimmedTask =
        session.type === "focus" ? taskLabelRef.current.trim() : "";
      try {
        await sessionApi.create({
          startedAt: session.startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
          durationSeconds: Math.min(elapsedSec, session.durationSec),
          type: session.type,
          completed,
          ...(trimmedTask ? { taskLabel: trimmedTask } : {}),
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
    },
    [toast],
  );

  const persistActive = useCallback(() => {
    const running = runningRef.current;
    if (!running) return;
    saveActiveSession({
      phase: running.phase,
      durationSec: running.durationSec,
      startedAt: running.startedAt.getTime(),
      endTarget: endTargetRef.current,
      completedFocus: completedFocusRef.current,
      taskLabel: taskLabelRef.current,
    });
  }, []);

  const beginPhaseRef = useRef<(phase: Phase) => void>(() => {});
  const tickRef = useRef<() => void>(() => {});

  const tick = useCallback(() => {
    const left = Math.max(
      0,
      Math.round((endTargetRef.current - Date.now()) / 1000),
    );
    setRemaining(left);
    if (left > 0 || finishingRef.current) return;

    finishingRef.current = true;
    clearTimer();
    const finished = runningRef.current;
    runningRef.current = null;
    clearActiveSession();
    setStatus("done");
    if (!finished) return;

    playSessionChime();
    notify(
      finished.type === "focus" ? "Foco concluido!" : "Pausa concluida!",
      "Sua sessao terminou.",
    );
    void save(finished, true, new Date(), finished.durationSec);

    const config = configRef.current;
    if (!config.autoCycle) return;

    let completedFocus = completedFocusRef.current;
    if (finished.type === "focus") {
      completedFocus += 1;
      completedFocusRef.current = completedFocus;
    }
    const upcoming = nextPhase(
      finished.type,
      completedFocus,
      config.pomodorosUntilLongBreak,
    );
    beginPhaseRef.current(upcoming);
  }, [clearTimer, save]);
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const beginPhase = useCallback(
    (targetPhase: Phase) => {
      const seconds = phaseMinutes(targetPhase, configRef.current) * 60;
      runningRef.current = {
        phase: targetPhase,
        type: phaseType(targetPhase),
        durationSec: seconds,
        startedAt: new Date(),
      };
      finishingRef.current = false;
      endTargetRef.current = Date.now() + seconds * 1000;
      persistActive();
      setPhase(targetPhase);
      setDurationSec(seconds);
      setRemaining(seconds);
      setStatus("running");
      clearTimer();
      intervalRef.current = window.setInterval(() => tickRef.current(), 250);
    },
    [clearTimer, persistActive],
  );
  useEffect(() => {
    beginPhaseRef.current = beginPhase;
  }, [beginPhase]);

  useEffect(() => {
    const saved = loadActiveSession();
    if (!saved) return;
    const left = remainingSeconds(saved.endTarget, Date.now());
    if (left <= 0) {
      clearActiveSession();
      return;
    }
    runningRef.current = {
      phase: saved.phase,
      type: phaseType(saved.phase),
      durationSec: saved.durationSec,
      startedAt: new Date(saved.startedAt),
    };
    completedFocusRef.current = saved.completedFocus;
    finishingRef.current = false;
    endTargetRef.current = saved.endTarget;
    setPhase(saved.phase);
    setTaskLabel(saved.taskLabel);
    setDurationSec(saved.durationSec);
    setRemaining(left);
    setStatus("running");
    clearTimer();
    intervalRef.current = window.setInterval(() => tickRef.current(), 250);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectPreset = useCallback(
    (targetType: SessionType, minutes: number) => {
      if (status === "running") return;
      setPhase(targetType === "focus" ? "focus" : "shortBreak");
      setDurationSec(minutes * 60);
      setRemaining(minutes * 60);
      setStatus("idle");
    },
    [status],
  );

  const start = useCallback(() => {
    if (status === "running") return;
    completedFocusRef.current = 0;
    beginPhase(phase);
  }, [status, phase, beginPhase]);

  const stop = useCallback(() => {
    if (status !== "running") return;
    clearTimer();
    finishingRef.current = true;
    const finished = runningRef.current;
    runningRef.current = null;
    clearActiveSession();
    const endedAt = new Date();
    const elapsed = finished
      ? Math.round((endedAt.getTime() - finished.startedAt.getTime()) / 1000)
      : 0;
    completedFocusRef.current = 0;
    setStatus("idle");
    setRemaining(finished?.durationSec ?? durationSec);
    if (finished) void save(finished, false, endedAt, elapsed);
  }, [status, clearTimer, durationSec, save]);

  return {
    type,
    phase,
    remaining,
    status,
    running: status === "running",
    autoCycle,
    presets,
    selectPreset,
    taskLabel,
    setTaskLabel,
    start,
    stop,
  };
}
