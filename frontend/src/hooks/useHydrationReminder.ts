import { useCallback, useEffect, useRef, useState } from "react";

export const HYDRATION_SNOOZE_MINUTES = 5;
const CHECK_INTERVAL_MS = 1000;
const MILLISECONDS_PER_MINUTE = 60_000;

interface HydrationReminder {
  due: boolean;
  acknowledge: () => void;
  snooze: () => void;
}

export function useHydrationReminder(intervalMinutes: number): HydrationReminder {
  const [due, setDue] = useState(false);
  const dueAtRef = useRef<number | null>(null);

  const scheduleIn = useCallback((minutes: number) => {
    dueAtRef.current = Date.now() + minutes * MILLISECONDS_PER_MINUTE;
    setDue(false);
  }, []);

  useEffect(() => {
    if (intervalMinutes <= 0) {
      dueAtRef.current = null;
      setDue(false);
      return;
    }

    scheduleIn(intervalMinutes);
    const timerId = setInterval(() => {
      if (dueAtRef.current !== null && Date.now() >= dueAtRef.current) {
        dueAtRef.current = null;
        setDue(true);
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(timerId);
  }, [intervalMinutes, scheduleIn]);

  const acknowledge = useCallback(() => {
    if (intervalMinutes > 0) scheduleIn(intervalMinutes);
  }, [intervalMinutes, scheduleIn]);

  const snooze = useCallback(
    () => scheduleIn(HYDRATION_SNOOZE_MINUTES),
    [scheduleIn],
  );

  return { due, acknowledge, snooze };
}
