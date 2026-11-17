'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ConsentProvider } from '@/components/providers/ConsentProvider';
import { ProgressProvider } from '@/components/providers/ProgressProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProgressProvider>
        <ConsentProvider>{children}</ConsentProvider>
      </ProgressProvider>
    </AuthProvider>
  );
}
