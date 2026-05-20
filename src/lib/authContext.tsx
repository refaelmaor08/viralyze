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

interface AuthContextValue {
  user: AuthUser | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  supabaseUser: null,
  loading: true,
  signOut: async () => {},
  refresh: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const applySupabaseUser = useCallback((sbUser: SupabaseUser | null) => {
    if (!sbUser) return;
    const authUser: AuthUser = {
      email: sbUser.email ?? '',
      provider:
        (sbUser.app_metadata?.provider as AuthUser['provider']) ?? 'email',
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
      // Supabase not configured — use localStorage auth only
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

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
