"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** true while the initial anonymous sign-in is still in-flight */
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureAnonymousSession = useCallback(async () => {
    // 1. Check for an existing valid session first (persisted in localStorage by @supabase/ssr)
    const {
      data: { session: existingSession },
    } = await supabase.auth.getSession();

    if (existingSession) {
      setSession(existingSession);
      setUser(existingSession.user);
      setLoading(false);
      return;
    }

    // 2. No session found — create a new anonymous one
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error("[Auth] Anonymous sign-in failed:", error.message);
      setLoading(false);
      return;
    }

    setSession(data.session);
    setUser(data.user);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    ensureAnonymousSession();

    // Keep session state in sync across tabs and token refreshes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [ensureAnonymousSession, supabase]);

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
