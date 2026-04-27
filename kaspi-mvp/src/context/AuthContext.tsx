"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { syncAccountData } from "@/application/transactions/useCases";
import { clearClientAppStorage } from "@/infrastructure/storage/transactionStorageKeys";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthActionResult = {
  error: string | null;
  requiresEmailConfirmation?: boolean;
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isSyncingAccount: boolean;
  isConfigured: boolean;
  signIn(email: string, password: string): Promise<AuthActionResult>;
  createAccount(email: string, password: string, displayName?: string): Promise<AuthActionResult>;
  signOut(): Promise<void>;
  refreshUser(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingAccount, setIsSyncingAccount] = useState(false);
  const syncedUserIdRef = useRef<string | null>(null);

  const runAccountSync = useCallback(async (nextUserId?: string) => {
    if (!nextUserId || syncedUserIdRef.current === nextUserId) return;

    setIsSyncingAccount(true);
    try {
      await syncAccountData(nextUserId);
      syncedUserIdRef.current = nextUserId;
    } finally {
      setIsSyncingAccount(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!isMounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        if (data.session?.user?.id) {
          await runAccountSync(data.session.user.id);
          if (!isMounted) return;
        } else {
          syncedUserIdRef.current = null;
          clearClientAppStorage();
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession?.user?.id) {
        syncedUserIdRef.current = null;
        clearClientAppStorage();
      }
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
      if (nextSession?.user?.id) {
        void runAccountSync(nextSession.user.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [runAccountSync]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: "Supabase is not configured." };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user?.id) {
      await runAccountSync(data.user.id);
    }
    return { error: error?.message ?? null };
  }, [runAccountSync]);

  const createAccount = useCallback(async (email: string, password: string, displayName?: string) => {
    if (!supabase) return { error: "Supabase is not configured." };

    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: displayName?.trim() ? { display_name: displayName.trim() } : undefined,
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.session?.user?.id) {
      await runAccountSync(data.session.user.id);
    }

    return {
      error: null,
      requiresEmailConfirmation: !data.session,
    };
  }, [runAccountSync]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    syncedUserIdRef.current = null;
    clearClientAppStorage();
    await supabase.auth.signOut();
  }, []);

  const refreshUser = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    setSession(data.session ?? null);
    setUser(data.session?.user ?? null);
    if (data.session?.user?.id) {
      await runAccountSync(data.session.user.id);
    }
  }, [runAccountSync]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      isSyncingAccount,
      isConfigured: isSupabaseConfigured,
      signIn,
      createAccount,
      signOut,
      refreshUser,
    }),
    [user, session, isLoading, isSyncingAccount, signIn, createAccount, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
