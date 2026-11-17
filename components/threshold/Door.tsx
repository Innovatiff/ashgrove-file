'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useProgress } from '@/components/providers/ProgressProvider';
import { CodeInput, type CodeOutcome } from '@/components/ui/CodeInput';
import { checkAnswer, describeFailure } from '@/lib/api';
import { firebase, track } from '@/lib/firebase';
import { OATH_ROUTE, THRESHOLD } from '@/lib/rooms';

/**
 * The way in. One word, checked by the checkAnswer function: this component
 * does not know what the word is, and neither does anything else in the
 * bundle.
 */
export function Door() {
  const router = useRouter();
  const { progress } = useProgress();
  const [reopening, setReopening] = useState<'idle' | 'pending' | 'done' | 'failed'>('idle');

  // A detective who has just signed back in is taken to their place.
  const restored = reopening === 'done' && progress.ready;
  useEffect(() => {
    if (restored && progress.thresholdSolved) router.push(progress.resumeRoute);
  }, [restored, progress.thresholdSolved, progress.resumeRoute, router]);

  async function speak(word: string): Promise<CodeOutcome> {
    try {
      const result = await checkAnswer(THRESHOLD, word);
      if (!result.correct) return { status: 'wrong', message: 'No. Look again.' };
      void track('threshold_passed');
      router.push(result.next ?? OATH_ROUTE);
      return { status: 'correct', message: 'The door is open.' };
    } catch (error) {
      const failure = describeFailure(error);
      return failure.retryAfterSeconds
        ? { status: 'blocked', message: failure.message, retryAfterSeconds: failure.retryAfterSeconds }
        : { status: 'error', message: failure.message };
    }
  }

  async function reopen() {
    setReopening('pending');
    try {
      await signInWithPopup(firebase().auth, new GoogleAuthProvider());
      setReopening('done');
    } catch (error) {
      const code = (error as { code?: string }).code ?? '';
      const walkedAway = code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request';
      setReopening(walkedAway ? 'idle' : 'failed');
    }
  }

  if (progress.ready && progress.thresholdSolved) {
    return (
      <div className="flex flex-col gap-4" data-testid="door-open">
        <p className="mono mono--lg">The door is already open to you.</p>
        <div>
          <Link href={progress.resumeRoute} className="btn btn--ember">
            {progress.oathSigned ? 'Return to the file' : 'Continue to the oath'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <CodeInput label="State the word that lets you in" submitLabel="Speak" maxLength={32} onSubmit={speak} />

      <p className="mono muted">
        Already sworn in on another device?{' '}
        <button type="button" className="link mono text-paper" onClick={reopen} disabled={reopening === 'pending'}>
          Reopen your file
        </button>
        <span role="status" aria-live="polite">
          {reopening === 'failed' ? ' The archive could not verify that account.' : null}
          {restored && !progress.thresholdSolved ? ' No file is held under that account. Start at the door.' : null}
        </span>
      </p>
    </div>
  );
}
