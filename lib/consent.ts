/**
 * One question, asked once for the whole site: may it use Google Analytics?
 *
 * Analytics is the only thing on this site that is not needed to play, and
 * the only thing that sets cookies. So it stays off until a visitor allows
 * it. The answer is kept in the visitor's own browser (localStorage, which is
 * never sent to a server), so that the question is not asked again, and every
 * room reads the same answer.
 *
 * Nothing here imports Firebase or React: the main website, which loads
 * neither, uses this file to show the answer and let it be changed.
 */

export type AnalyticsChoice = 'granted' | 'denied';

export interface Consent {
  analytics: AnalyticsChoice;
  /** When the answer was given, as an ISO date. */
  at: string;
  /** The version of the question that was answered. */
  v: number;
}

export const CONSENT_KEY = 'unsealed.consent';

/** Raise this when what is being asked changes. Every visitor is then asked again. */
export const CONSENT_VERSION = 1;

/** An answer is asked for again after a year. */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Reads a stored answer. Anything unreadable, for an older question, dated
 * in the future or more than a year old counts as no answer at all, and no
 * answer means analytics is off.
 */
export function parseConsent(raw: string | null | undefined, now: number = Date.now()): Consent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Consent> | null;
    if (!value || typeof value !== 'object') return null;
    if (value.analytics !== 'granted' && value.analytics !== 'denied') return null;
    if (value.v !== CONSENT_VERSION || typeof value.at !== 'string') return null;
    const at = Date.parse(value.at);
    if (!Number.isFinite(at) || at > now + 60_000 || now - at > CONSENT_MAX_AGE_MS) return null;
    return { analytics: value.analytics, at: value.at, v: value.v };
  } catch {
    return null;
  }
}

// If the browser will not let the page use localStorage, the answer is kept
// for as long as the page is open and asked for again next time.
let memory: string | null = null;

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The stored answer exactly as it is stored, or null. */
export function consentSnapshot(): string | null {
  try {
    return storage()?.getItem(CONSENT_KEY) ?? memory;
  } catch {
    return memory;
  }
}

export function readConsent(): Consent | null {
  return parseConsent(consentSnapshot());
}

/** True only when a visitor has said yes, and recently enough. */
export function analyticsAllowed(): boolean {
  return readConsent()?.analytics === 'granted';
}

const CHANGED = 'unsealed:consent';

/** Records the visitor's answer and tells every listener on the page. */
export function writeConsent(analytics: AnalyticsChoice): void {
  const value: Consent = { analytics, at: new Date().toISOString(), v: CONSENT_VERSION };
  memory = JSON.stringify(value);
  try {
    storage()?.setItem(CONSENT_KEY, memory);
  } catch {
    // Kept in memory only.
  }
  if (analytics === 'denied') clearAnalyticsCookies();
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGED));
}

/** Calls the listener when the answer changes, in this tab or in another. */
export function subscribeConsent(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === CONSENT_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGED, listener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGED, listener);
  };
}

/** The names of Google Analytics' cookies among those in a cookie string. */
export function analyticsCookieNames(cookies: string): string[] {
  return cookies
    .split(';')
    .map((part) => part.split('=')[0]?.trim() ?? '')
    .filter((name) => /^_ga(_|$)|^_gid$|^_gat(_|$)/.test(name));
}

/**
 * Removes any Google Analytics cookies the page can see: those left from a
 * time the visitor allowed it, or from before the question existed.
 */
export function clearAnalyticsCookies(): void {
  if (typeof document === 'undefined') return;
  const names = analyticsCookieNames(document.cookie);
  if (names.length === 0) return;
  // A cookie is only removed by the same domain it was set for, and the page
  // cannot see which that was. Try the host and each domain above it.
  const labels = window.location.hostname.split('.');
  const domains = ['', ...labels.slice(0, -1).map((_, index) => `.${labels.slice(index).join('.')}`)];
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ''}`;
    }
  }
}
