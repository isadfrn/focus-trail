import { request } from "../lib/http";
import type { Preferences, User } from "../types/user";

/** Auth + current-user data access (the frontend's "repository" for auth/me). */
export const authApi = {
  me: () => request<{ user: User }>("/me"),
  register: (email: string, password: string) =>
    request<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  updatePreferences: (data: Preferences) =>
    request<{ user: User }>("/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>("/me/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
