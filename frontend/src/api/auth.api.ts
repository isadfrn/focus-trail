import { request } from "../lib/http";
import type { User } from "../types/user";

/** Auth data access (the frontend's "repository" for the auth resource). */
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
};
