'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Zap } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#D4A843] border-t-transparent animate-spin" />
        <div className="flex items-center gap-2">
          <span className="font-black text-white">Viral</span>
          <span className="font-black gold-text">yze</span>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4A843] to-[#F0C060] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-black fill-black" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
