export interface User {
  id: string;
  email: string;
  character: string;
  focusMinutes: number;
  breakMinutes: number;
  createdAt?: string;
}

export interface Preferences {
  character?: string;
  focusMinutes?: number;
  breakMinutes?: number;
}
