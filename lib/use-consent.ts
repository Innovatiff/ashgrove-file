'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { type Consent, consentSnapshot, parseConsent, subscribeConsent } from '@/lib/consent';

/**
 * The visitor's answer about analytics, kept in step with the browser's
 * storage: it changes the moment they answer, here or in another tab. null
 * means they have not been asked, or their answer has lapsed.
 *
 * While the page is being prerendered, and until it has loaded in a browser,
 * the answer reads as null.
 */
export function useConsent(): Consent | null {
  const raw = useSyncExternalStore(subscribeConsent, consentSnapshot, () => null);
  return useMemo(() => parseConsent(raw), [raw]);
}
