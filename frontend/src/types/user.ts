export interface User {
  id: string;
  email: string;
  character: string;
  focusMinutes: number;
  breakMinutes: number;
  autoCycle: boolean;
  longBreakMinutes: number;
  pomodorosUntilLongBreak: number;
  dailyFocusGoalMinutes: number;
  createdAt?: string;
}

export interface Preferences {
  character?: string;
  focusMinutes?: number;
  breakMinutes?: number;
  autoCycle?: boolean;
  longBreakMinutes?: number;
  pomodorosUntilLongBreak?: number;
  dailyFocusGoalMinutes?: number;
}
