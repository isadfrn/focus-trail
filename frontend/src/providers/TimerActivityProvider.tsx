import { createContext, useContext, useState, type ReactNode } from "react";

interface TimerActivity {
  running: boolean;
  setRunning: (running: boolean) => void;
}

const TimerActivityContext = createContext<TimerActivity | null>(null);

/**
 * Shares whether a timer session is currently running so UI outside the Timer
 * page (e.g. the scenario picker in the menu) can react — like locking the
 * character choice while a session is in progress.
 */
export function TimerActivityProvider({ children }: { children: ReactNode }) {
  const [running, setRunning] = useState(false);
  return (
    <TimerActivityContext.Provider value={{ running, setRunning }}>
      {children}
    </TimerActivityContext.Provider>
  );
}

export function useTimerActivity(): TimerActivity {
  const ctx = useContext(TimerActivityContext);
  if (!ctx)
    throw new Error(
      "useTimerActivity precisa estar dentro de <TimerActivityProvider>",
    );
  return ctx;
}
