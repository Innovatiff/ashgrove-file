'use client';

import type { ReactNode } from 'react';
import { CellarProvider } from '@/components/goldmaker/CellarProvider';
import { ConsentProvider } from '@/components/providers/ConsentProvider';

/** The room's own state: the answer about analytics, and where the visitor stands with the cellar. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConsentProvider>
      <CellarProvider>{children}</CellarProvider>
    </ConsentProvider>
  );
}
