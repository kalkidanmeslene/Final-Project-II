"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ApiError, ApiResponse } from "@/lib/http/api-response";
import type { AuthUser } from "@/lib/auth/types";

type MeResponse = { user: AuthUser };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<AuthUser | null>;
  login: (
    identifier: string,
    password: string,
  ) => Promise<{ ok: true; user: AuthUser | null } | { ok: false; error: ApiError }>;
  logout: () => Promise<void>;
  setError: (message: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const json = (await res.json()) as ApiResponse<MeResponse>;
      if (!json.ok) {
        if (mountedRef.current) {
          setUser(null);
          if (res.status !== 401) setError(json.error.message);
        }
        return null;
      }
      if (mountedRef.current) setUser(json.data.user);
      return json.data.user;
    } catch {
      if (mountedRef.current) {
        setError("Failed to load session.");
        setUser(null);
      }
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      if (mountedRef.current) setError(null);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password }),
      });
      const json = (await res.json()) as ApiResponse<{ userId: string }>;
      if (!json.ok) {
        if (mountedRef.current) setError(json.error.message);
        return { ok: false as const, error: json.error };
      }
      const me = await refresh();
      return { ok: true as const, user: me };
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    if (mountedRef.current) setUser(null);
  }, []);

  const setErrorSafe = useCallback((message: string | null) => {
    if (mountedRef.current) setError(message);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      refresh,
      login,
      logout,
      setError: setErrorSafe,
    }),
    [user, loading, error, refresh, login, logout, setErrorSafe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
