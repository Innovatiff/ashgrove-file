'use client';

import {
  type AuthCredential,
  GoogleAuthProvider,
  linkWithPopup,
  signInWithCredential,
} from 'firebase/auth';
import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { firebase, track } from '@/lib/firebase';

type State =
  | { step: 'idle' }
  | { step: 'pending' }
  | { step: 'linked' }
  /** The Google account already holds a file of its own. */
  | { step: 'conflict'; credential: AuthCredential }
  | { step: 'failed'; message: string };

/**
 * "Keep my file on any device."
 *
 * Optional. Upgrades the anonymous account to a Google account with
 * linkWithPopup: the uid stays the same, so every solved room, every hint and
 * the oath itself carry over. Without it the file lives in this browser only.
 */
export function KeepFile() {
  const { isAnonymous, user } = useAuth();
  const [state, setState] = useState<State>({ step: 'idle' });

  const linked = state.step === 'linked' || (user !== null && !isAnonymous);

  async function keep() {
    const current = firebase().auth.currentUser;
    if (!current) return;
    setState({ step: 'pending' });
    try {
      await linkWithPopup(current, new GoogleAuthProvider());
      void track('file_linked');
      setState({ step: 'linked' });
    } catch (error) {
      const code = (error as { code?: string }).code ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setState({ step: 'idle' });
        return;
      }
      if (code === 'auth/credential-already-in-use') {
        const credential = GoogleAuthProvider.credentialFromError(error as never);
        if (credential) {
          setState({ step: 'conflict', credential });
          return;
        }
      }
      if (process.env.NODE_ENV !== 'production') console.error(error);
      setState({
        step: 'failed',
        message:
          code === 'auth/popup-blocked'
            ? 'Your browser blocked the sign-in window. Allow it and try again.'
            : 'The archive could not link that account. Your file is unchanged.',
      });
    }
  }

  async function openTheOther(credential: AuthCredential) {
    setState({ step: 'pending' });
    try {
      await signInWithCredential(firebase().auth, credential);
      setState({ step: 'linked' });
    } catch {
      setState({ step: 'failed', message: 'The archive could not open that file.' });
    }
  }

  if (linked) {
    return (
      <p className="mono text-paper" role="status" data-testid="file-kept">
        This file is linked. Sign in with the same Google account on any device and it follows you.
      </p>
    );
  }

  if (state.step === 'conflict') {
    return (
      <div className="flex flex-col gap-3" role="alert">
        <p className="text-paper">
          That Google account already holds a file. You can open it here instead. What you have done on this device stays
          behind.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" className="btn" onClick={() => openTheOther(state.credential)}>
            Open that file instead
          </button>
          <button type="button" className="btn" onClick={() => setState({ step: 'idle' })}>
            Keep this one
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="muted">
        Optional. Link a Google account and this file follows you. Without it, the file lives in this browser only.
      </p>
      <div>
        <button type="button" className="btn btn--wrap" onClick={keep} disabled={state.step === 'pending'} data-testid="keep-file">
          {state.step === 'pending' ? 'Waiting for Google' : 'Keep my file on any device'}
        </button>
      </div>
      <p className="mono text-paper min-h-[1.6em]" role="status" aria-live="polite">
        {state.step === 'failed' ? state.message : null}
      </p>
    </div>
  );
}
