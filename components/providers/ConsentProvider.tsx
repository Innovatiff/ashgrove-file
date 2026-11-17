'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type AnalyticsChoice, type Consent, writeConsent } from '@/lib/consent';
import { applyAnalyticsConsent } from '@/lib/firebase';
import { useConsent } from '@/lib/use-consent';

export interface ConsentState {
  /** The visitor's answer about analytics. null until they have given one. */
  consent: Consent | null;
  /** True while the question is open because the visitor asked to see it again. */
  asking: boolean;
  /** Opens the question again, so an answer can be changed. */
  ask: () => void;
  /** Records an answer and closes the question. */
  answer: (choice: AnalyticsChoice) => void;
}

const ConsentContext = createContext<ConsentState>({ consent: null, asking: false, ask: () => {}, answer: () => {} });

/**
 * Holds the visitor's answer about analytics and keeps Google Analytics in
 * step with it: off until they allow it, started when they do, stopped and
 * its cookies removed if they change their mind.
 */
export function ConsentProvider({ children }: { children: ReactNode }) {
  const consent = useConsent();
  const [asking, setAsking] = useState(false);

  // On load, and whenever the answer changes, here or in another tab.
  const choice = consent?.analytics ?? null;
  useEffect(() => {
    void applyAnalyticsConsent();
  }, [choice]);

  const ask = useCallback(() => setAsking(true), []);
  const answer = useCallback((given: AnalyticsChoice) => {
    writeConsent(given);
    setAsking(false);
  }, []);

  const value = useMemo(() => ({ consent, asking, ask, answer }), [consent, asking, ask, answer]);
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsentChoice(): ConsentState {
  return useContext(ConsentContext);
}
