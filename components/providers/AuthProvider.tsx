'use client';

import { onIdTokenChanged, signInAnonymously, type User } from 'firebase/auth';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { firebase } from '@/lib/firebase';

export interface AuthState {
  /** loading until Firebase reports who the visitor is. */
  status: 'loading' | 'ready' | 'error';
  user: User | null;
  uid: string | null;
  /** True for a visitor who has not linked a Google account. */
  isAnonymous: boolean;
}

const INITIAL: AuthState = { status: 'loading', user: null, uid: null, isAnonymous: true };

const AuthContext = createContext<AuthState>(INITIAL);

/**
 * Signs every visitor in anonymously on first load, so progress at the
 * Threshold is saved before the Oath. Firebase keeps the account in the
 * browser, so a returning visitor is the same detective.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    const fail = (error: unknown) => {
      console.error('[ashgrove] sign-in failed', error);
      if (!cancelled) setState({ status: 'error', user: null, uid: null, isAnonymous: true });
    };

    try {
      const { auth } = firebase();
      // onIdTokenChanged also fires when an anonymous account is linked.
      const unsubscribe = onIdTokenChanged(auth, (user) => {
        if (cancelled) return;
        if (user) {
          setState({ status: 'ready', user, uid: user.uid, isAnonymous: user.isAnonymous });
        } else {
          signInAnonymously(auth).catch(fail);
        }
      });
      return () => {
        cancelled = true;
        unsubscribe();
      };
    } catch (error) {
      queueMicrotask(() => fail(error));
      return () => {
        cancelled = true;
      };
    }
  }, []);

  const value = useMemo(() => state, [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
