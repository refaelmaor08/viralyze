'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap } from 'lucide-react';
import { supabase, supabaseReady } from '@/lib/supabase';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/analyze';

  useEffect(() => {
    if (!supabaseReady || !supabase) {
      router.push(next);
      return;
    }

    // Supabase automatically exchanges the PKCE code from the URL.
    // Listen for SIGNED_IN, then redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          subscription.unsubscribe();
          router.push(next);
        }
      },
    );

    // Safety redirect if auth event never fires (e.g. direct navigation)
    const timer = setTimeout(() => {
      subscription.unsubscribe();
      router.push(next);
    }, 4000);

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [next, router]);

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6">
      <div className="w-12 h-12 rounded-full border-2 border-[#D4A843] border-t-transparent animate-spin" />
      <div className="flex items-center gap-2">
        <span className="text-lg font-black text-white">Viral</span>
        <span className="text-lg font-black gold-text">yze</span>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4A843] to-[#F0C060] flex items-center justify-center ml-1">
          <Zap className="w-3.5 h-3.5 text-black fill-black" />
        </div>
      </div>
      <p className="text-white/40 text-sm">מתחבר לחשבון...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
