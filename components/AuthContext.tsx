"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  points: number;
}

interface AuthContextValue {
  user: UserInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string, role?: "user" | "admin") => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      if (data.user) setUser(data.user);
      else setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: email.trim().toLowerCase(), password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { error: data.error || "Login failed." };
        if (data.user) setUser(data.user);
        if (data.token && typeof window !== "undefined") {
          localStorage.setItem("smart-waste-token", data.token);
        }
        return {};
      } catch (err) {
        return { error: "Network error. Please try again." };
      }
    },
    []
  );

  const register = useCallback(
    async (name: string, email: string, password: string, role: "user" | "admin" = "user") => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            role
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { error: data.error || "Registration failed." };
        if (data.user) setUser(data.user);
        if (data.token && typeof window !== "undefined") {
          localStorage.setItem("smart-waste-token", data.token);
        }
        return {};
      } catch (err) {
        return { error: "Network error. Please try again." };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      if (typeof window !== "undefined") localStorage.removeItem("smart-waste-token");
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
