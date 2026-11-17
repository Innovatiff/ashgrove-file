import { type FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import type { Analytics } from 'firebase/analytics';
import { type Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, type Firestore, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, type Functions, getFunctions } from 'firebase/functions';
import { REGION } from '@/functions/src/config/region';

/**
 * Firebase for the browser.
 *
 * The web config comes from NEXT_PUBLIC_FIREBASE_* in .env.local. Nothing is
 * initialised at import time: firebase() builds everything on first call and
 * hands back the same instances afterwards, so the static export can be
 * prerendered without touching Firebase at all.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/** True when the app should talk to the local Emulator Suite. */
export const USE_EMULATORS = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

// Ports from firebase.json.
const EMULATOR_PORTS = { auth: 9099, firestore: 8080, functions: 5001 } as const;

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  functions: Functions;
}

let services: FirebaseServices | undefined;

export function firebase(): FirebaseServices {
  if (services) return services;

  if (!config.apiKey || !config.projectId || !config.appId) {
    throw new Error(
      'Firebase web config is missing. Check that .env.local defines the NEXT_PUBLIC_FIREBASE_* variables, then rebuild.',
    );
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app, REGION);

  if (USE_EMULATORS) {
    // The page may be opened as localhost, 127.0.0.1 or a LAN address.
    const host = typeof window === 'undefined' ? '127.0.0.1' : window.location.hostname || '127.0.0.1';
    connectAuthEmulator(auth, `http://${host}:${EMULATOR_PORTS.auth}`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, EMULATOR_PORTS.firestore);
    connectFunctionsEmulator(functions, host, EMULATOR_PORTS.functions);
  }

  services = { app, auth, db, functions };
  return services;
}

let analyticsPromise: Promise<Analytics | null> | undefined;

/**
 * Analytics, or null. Only ever resolves to an instance in a real browser,
 * after isSupported(), and never against the emulators.
 */
export function analytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined' || USE_EMULATORS || !config.measurementId) return Promise.resolve(null);

  analyticsPromise ??= (async () => {
    try {
      const { getAnalytics, isSupported } = await import('firebase/analytics');
      return (await isSupported()) ? getAnalytics(firebase().app) : null;
    } catch {
      return null;
    }
  })();

  return analyticsPromise;
}

/** Records an event if analytics is available. Never throws. */
export async function track(event: string, params?: Record<string, string | number | boolean>): Promise<void> {
  const instance = await analytics();
  if (!instance) return;
  const { logEvent } = await import('firebase/analytics');
  logEvent(instance, event, params);
}
