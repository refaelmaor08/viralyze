'use client';

import { AuthProvider } from '@/lib/authContext';
import FloatingChatButton from '@/components/ui/FloatingChatButton';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <FloatingChatButton />
    </AuthProvider>
  );
}
