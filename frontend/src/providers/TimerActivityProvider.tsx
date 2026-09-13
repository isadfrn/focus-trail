import { createContext, useContext, useState, type ReactNode } from "react";

interface TimerActivity {
  running: boolean;
  setRunning: (running: boolean) => void;
}

const TimerActivityContext = createContext<TimerActivity | null>(null);

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
      "useTimerActivity must be used within <TimerActivityProvider>",
    );
  return ctx;
}
