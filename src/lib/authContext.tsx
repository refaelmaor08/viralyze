'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, supabaseReady } from './supabase';
import { clearUser, getUser, setUser, type AuthUser } from './auth';
import { type PlanId, getPlan } from './plans';
import { getUsedAnalyses } from './analyses';
import { UNLIMITED_TEST_MODE } from './testMode';

interface AuthContextValue {
  user: AuthUser | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  plan: ReturnType<typeof getPlan>;
  usedAnalyses: number;
  remainingAnalyses: number;
  signOut: () => Promise<void>;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  supabaseUser: null,
  loading: true,
  plan: getPlan('free'),
  usedAnalyses: 0,
  remainingAnalyses: 3,
  signOut: async () => {},
  refresh: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const applySupabaseUser = useCallback((sbUser: SupabaseUser | null) => {
    if (!sbUser) return;
    const existing = getUser();
    const authUser: AuthUser = {
      email: sbUser.email ?? '',
      provider: (sbUser.app_metadata?.provider as AuthUser['provider']) ?? 'email',
      plan: existing?.plan ?? 'free',
    };
    setUser(authUser);
    setUserState(authUser);
    setSupabaseUser(sbUser);
  }, []);

  useEffect(() => {
    if (supabaseReady && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          applySupabaseUser(data.session.user);
        } else {
          setUserState(getUser());
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user) {
            applySupabaseUser(session.user);
          } else {
            clearUser();
            setUserState(null);
            setSupabaseUser(null);
          }
        },
      );

      return () => subscription.unsubscribe();
    } else {
      setUserState(getUser());
      setLoading(false);
    }
  }, [applySupabaseUser]);

  const signOut = useCallback(async () => {
    if (supabaseReady && supabase) await supabase.auth.signOut();
    clearUser();
    setUserState(null);
    setSupabaseUser(null);
  }, []);

  const refresh = useCallback(() => {
    setUserState(getUser());
  }, []);

  const planId: PlanId = user?.plan ?? 'free';
  const basePlan = getPlan(planId);
  // In unlimited test mode: give unlimited duration + analyses so no UI blockers appear
  const plan = UNLIMITED_TEST_MODE
    ? { ...basePlan, maxDurationSec: 600, monthlyAnalyses: 9999 }
    : basePlan;
  const usedAnalyses = (UNLIMITED_TEST_MODE || !user) ? 0 : getUsedAnalyses(user.email, plan.isLifetimeLimit);
  const remainingAnalyses = UNLIMITED_TEST_MODE ? 9999 : Math.max(0, plan.monthlyAnalyses - usedAnalyses);

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, plan, usedAnalyses, remainingAnalyses, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
