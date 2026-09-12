import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { authApi, type RegisterResult } from "../api/auth.api";
import { ApiError } from "../errors/api-error";
import type { User } from "../types/user";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<RegisterResult>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Replaces the cached user (e.g. after updating preferences). */
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then((r) => setUser(r.user))
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) {
          console.error("Falha ao carregar sessao:", err);
        }
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const r = await authApi.login(email, password);
    setUser(r.user);
  };
  const register = async (email: string, password: string) => {
    const result = await authApi.register(email, password);
    if ("user" in result) setUser(result.user);
    return result;
  };
  const verifyEmail = async (email: string, code: string) => {
    const r = await authApi.verifyEmail(email, code);
    setUser(r.user);
  };
  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };
  const updateUser = (next: User) => setUser(next);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyEmail,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
