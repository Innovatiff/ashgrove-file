'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useId, useState } from 'react';
import { useCellar } from '@/components/goldmaker/CellarProvider';
import { track } from '@/lib/firebase';
import { describeFailure, enter, wake } from '@/lib/goldmaker/api';
import { CELLAR_ROUTE, MAX_NAME_LENGTH } from '@/lib/goldmaker/shape';
import { LEGAL } from '@/lib/site/brand';

const PRIVACY = LEGAL.find((item) => item.label === 'Privacy')?.href ?? '/privacy';

/**
 * The door of the room: a warrant to sign.
 *
 * Signing is what makes a visitor's file, and so it is what lets them in.
 * Until they sign, this page signs nobody in and keeps nothing.
 *
 * If the room is ever sold, this is where its price goes: above the name,
 * with whatever takes the payment. The function that makes the file checks
 * the same thing on the server (functions/src/goldmaker/access.ts), so what
 * is shown here is never the lock.
 */
export function Warrant() {
  const { standing, player } = useCellar();
  const router = useRouter();
  const id = useId();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  if (standing === 'inside') {
    return (
      <div data-testid="warrant-inside">
        <p className="text-[1.3rem]">
          The warrant is signed{player?.name ? `, ${player.name}` : ''}. {player?.closedAt ? 'You have been in, and out again.' : 'The cellar is as you left it.'}
        </p>
        <p className="mt-6">
          <Link href={CELLAR_ROUTE} className="btn" data-testid="warrant-return">
            {player?.closedAt ? 'Go back down and look round' : 'Go back down'}
          </Link>
        </p>
      </div>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    // The function checks the name properly. This only saves asking it about nothing.
    if (name.trim().length === 0) {
      setProblem('Sign your name.');
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      await enter(name);
      void track('goldmaker_entered');
      router.push(CELLAR_ROUTE);
    } catch (error) {
      setProblem(describeFailure(error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate data-testid="warrant">
      <div className="field">
        <label htmlFor={id} className="label">
          Your name, for the warrant
        </label>
        <input
          id={id}
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          // Somebody is about to sign: wake the function, so they are not kept at the door.
          onFocus={wake}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="nickname"
          autoCapitalize="words"
          spellCheck={false}
          placeholder="Sign here"
          aria-describedby={`${id}-note${problem ? ` ${id}-problem` : ''}`}
          aria-invalid={problem ? true : undefined}
          data-testid="warrant-name"
        />
      </div>
      {problem ? (
        <p id={`${id}-problem`} role="alert" className="rubric mt-3" data-testid="warrant-problem">
          {problem}
        </p>
      ) : null}
      <p className="mt-6">
        <button type="submit" className="btn" disabled={busy || standing === 'finding' || standing === 'lost'} data-testid="warrant-sign">
          {busy ? 'The bar is going down' : 'Sign, and be shut in'}
        </button>
      </p>
      <p id={`${id}-note`} className="vellum__note">
        Signing makes a file for you in this browser, so that you can leave and come back. No account and no email. It
        costs nothing to play for now.{' '}
        <a href={PRIVACY} className="link">
          What is kept
        </a>
        {standing === 'lost' ? ' The cellar cannot be reached at the moment. Reload the page.' : null}
      </p>
    </form>
  );
}
