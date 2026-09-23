"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AVATAR_SRC } from "@/lib/constants";
import { AUTH_ERRORS } from "@/lib/auth/constants";
import { DB_ERRORS } from "@/lib/db/errors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  SUPABASE_MISSING_CONFIG,
  SUPABASE_NETWORK_ERROR,
  supabaseAuthErrorMessage,
  type SupabasePublicConfig,
} from "@/lib/supabase/env";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  plan: string;
  role?: "user" | "admin";
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  supabaseConfigured: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
  updateName: (name: string) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapSupabaseUser(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): AuthUser {
  const name =
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    user.email?.split("@")[0] ||
    "Nodir";
  return {
    id: user.id,
    email: user.email ?? "",
    name,
    avatarUrl:
      (typeof user.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url) ||
      AVATAR_SRC,
    plan: "free",
  };
}

async function hydrateProfile(base: AuthUser): Promise<AuthUser> {
  try {
    const response = await fetch("/api/profile");
    if (!response.ok) return { ...base, plan: base.plan || "free" };
    const json = (await response.json()) as {
      profile?: {
        name?: string | null;
        email?: string | null;
        avatarUrl?: string | null;
        plan?: string;
        role?: string;
      };
    };
    if (!json.profile) return { ...base, plan: "free" };
    return {
      ...base,
      name: json.profile.name || base.name,
      email: json.profile.email || base.email,
      avatarUrl: json.profile.avatarUrl || base.avatarUrl,
      plan: json.profile.plan || "free",
      role: json.profile.role === "admin" ? "admin" : "user",
    };
  } catch {
    return { ...base, plan: "free" };
  }
}

export function AuthProvider({
  children,
  supabase,
}: {
  children: React.ReactNode;
  supabase: SupabasePublicConfig | null;
}) {
  const supabaseConfigured = Boolean(supabase);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    async function load() {
      if (supabase) {
        const client = createSupabaseBrowserClient(supabase);
        if (!client) {
          if (!cancelled) setLoading(false);
          return;
        }
        try {
          const { data } = await client.auth.getUser();
          if (!cancelled && data.user) {
            setUser(await hydrateProfile(mapSupabaseUser(data.user)));
          }
          const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
            if (!session?.user) {
              setUser(null);
              return;
            }
            void hydrateProfile(mapSupabaseUser(session.user)).then(setUser);
          });
          unsubscribe = () => listener.subscription.unsubscribe();
        } catch {
          if (!cancelled) setUser(null);
        }
        if (!cancelled) setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/local");
      const json = (await response.json()) as { user?: AuthUser | null };
      if (!cancelled && json.user) {
        setUser({
          ...json.user,
          avatarUrl: AVATAR_SRC,
          plan: json.user.plan ?? "free",
        });
      }
      if (!cancelled) setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [supabase]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      if (supabase) {
        const client = createSupabaseBrowserClient(supabase);
        if (!client) return SUPABASE_MISSING_CONFIG;
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) return supabaseAuthErrorMessage(error);
        if (data.user) setUser(await hydrateProfile(mapSupabaseUser(data.user)));
        return null;
      }

      const response = await fetch("/api/auth/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const json = (await response.json()) as { user?: AuthUser; error?: string };
      if (!response.ok) return json.error ?? AUTH_ERRORS.generic;
      if (json.user) {
        setUser({ ...json.user, avatarUrl: AVATAR_SRC, plan: json.user.plan ?? "free" });
      }
      return null;
    } catch (error) {
      return supabaseAuthErrorMessage(error instanceof Error ? error : { message: "" });
    }
  }, [supabase]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      if (supabase) {
        const client = createSupabaseBrowserClient(supabase);
        if (!client) return SUPABASE_MISSING_CONFIG;
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) return supabaseAuthErrorMessage(error);
        if (data.user && data.session) {
          setUser(await hydrateProfile(mapSupabaseUser(data.user)));
          return null;
        }
        return "Hisob yaratildi. Emailingizni tasdiqlang, keyin kiring.";
      }

      const response = await fetch("/api/auth/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", email, password, name }),
      });
      const json = (await response.json()) as { user?: AuthUser; error?: string };
      if (!response.ok) return json.error ?? AUTH_ERRORS.generic;
      if (json.user) {
        setUser({ ...json.user, avatarUrl: AVATAR_SRC, plan: json.user.plan ?? "free" });
      }
      return null;
    } catch (error) {
      return supabaseAuthErrorMessage(error instanceof Error ? error : { message: "" });
    }
  }, [supabase]);

  const logout = useCallback(async () => {
    if (supabase) {
      const client = createSupabaseBrowserClient(supabase);
      await client?.auth.signOut();
      setUser(null);
      return;
    }
    await fetch("/api/auth/local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setUser(null);
  }, [supabase]);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) return SUPABASE_MISSING_CONFIG;
    const client = createSupabaseBrowserClient(supabase);
    if (!client) return SUPABASE_MISSING_CONFIG;
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) return supabaseAuthErrorMessage(error);
    return null;
  }, [supabase]);

  const updateName = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return "Ism bo'sh bo'lmasligi kerak.";
    if (!supabase) {
      setUser((current) => (current ? { ...current, name: trimmed } : current));
      return null;
    }
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = (await response.json()) as { profile?: { name?: string | null }; error?: string };
      if (!response.ok) return json.error ?? DB_ERRORS.load;
      setUser((current) =>
        current ? { ...current, name: json.profile?.name || trimmed } : current,
      );
      return null;
    } catch {
      return SUPABASE_NETWORK_ERROR;
    }
  }, [supabase]);

  const value = useMemo(
    () => ({
      user,
      loading,
      supabaseConfigured,
      login,
      register,
      logout,
      resetPassword,
      updateName,
    }),
    [user, loading, supabaseConfigured, login, register, logout, resetPassword, updateName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
