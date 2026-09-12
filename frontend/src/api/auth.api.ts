import { request } from "../lib/http";
import type { Preferences, User } from "../types/user";

/** Register either logs in (email disabled) or asks for email verification. */
export type RegisterResult =
  | { user: User }
  | { verificationRequired: true; email: string };

/** Auth + current-user data access (the frontend's "repository" for auth/me). */
export const authApi = {
  me: () => request<{ user: User }>("/me"),
  register: (email: string, password: string) =>
    request<RegisterResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  verifyEmail: (email: string, code: string) =>
    request<{ user: User }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),
  resendVerification: (email: string) =>
    request<{ ok: true }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  forgotPassword: (email: string) =>
    request<{ ok: true }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (email: string, code: string, newPassword: string) =>
    request<{ ok: true }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
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
