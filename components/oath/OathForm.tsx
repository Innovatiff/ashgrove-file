'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useId, useState } from 'react';
import { KeepFile } from '@/components/oath/KeepFile';
import { useProgress } from '@/components/providers/ProgressProvider';
import { DoubleRule } from '@/components/ui/DoubleRule';
import { Frame } from '@/components/ui/Frame';
import { Reveal } from '@/components/ui/Reveal';
import { describeFailure, signOath } from '@/lib/api';
import { track } from '@/lib/firebase';
import { MAX_NAME_LENGTH } from '@/lib/rooms';

/**
 * The Oath. A name, one promise, and the signOath function, which writes the
 * name, a badge number and the time to the detective's file and adds one to
 * the count of detectives entered.
 */
export function OathForm() {
  const id = useId();
  const router = useRouter();
  const { progress } = useProgress();
  const [name, setName] = useState('');
  const [promised, setPromised] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.replace(/\s+/g, ' ').trim();
  const ready = trimmed.length > 0 && promised && !pending;

  async function sign(event: FormEvent) {
    event.preventDefault();
    if (trimmed.length === 0) return setError('Sign your name.');
    if (!promised) return setError('Make the promise first. Tick the box.');
    setPending(true);
    setError(null);
    try {
      const result = await signOath(trimmed);
      void track('oath_signed');
      router.push(result.next);
    } catch (failure) {
      setError(describeFailure(failure).message);
      setPending(false);
    }
  }

  return (
    <div className="measure py-14 md:py-24">
      <div className="mx-auto max-w-[760px]">
        <Reveal>
          <p className="mono muted">Before Room I</p>
          <h1 className="title title--room mt-3">The Oath</h1>
          <p className="title title--lead mt-8">Sign your name. It goes on every page you touch.</p>
        </Reveal>

        {progress.oathSigned ? (
          <Reveal className="mt-12">
            <Frame label="On file" mark={progress.badge ?? undefined} className="px-6 pb-8 pt-10 md:px-10" data-testid="oath-on-file">
              <p className="text-paper">
                Your oath is already on file, Det. {progress.detectiveName}. It cannot be signed twice and it cannot be
                taken back.
              </p>
              <Link href={progress.resumeRoute} className="btn btn--ember mt-6">
                Return to the file
              </Link>
            </Frame>
          </Reveal>
        ) : (
          <Reveal className="mt-12">
            <Frame active label="Sworn statement">
              <form className="px-6 pb-8 pt-10 md:px-10 md:pb-10 md:pt-12" onSubmit={sign} noValidate>
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor={`${id}-name`} className="mono mono--lg">
                  Detective name
                </label>
                <span className="mono muted" aria-hidden="true">
                  {String([...name].length).padStart(2, '0')}/{MAX_NAME_LENGTH}
                </span>
              </div>
              <input
                id={`${id}-name`}
                name="name"
                className="field field--plain mt-3"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
                maxLength={MAX_NAME_LENGTH}
                autoComplete="off"
                autoCapitalize="words"
                spellCheck={false}
                required
                disabled={pending}
                aria-describedby={`${id}-name-help ${id}-status`}
              />
              <p id={`${id}-name-help`} className="mono muted mt-2">
                {MAX_NAME_LENGTH} characters at most. Letters, numbers, spaces, hyphens, apostrophes.
              </p>

              <label htmlFor={`${id}-promise`} className="mt-8 flex cursor-pointer items-start gap-4">
                <input
                  id={`${id}-promise`}
                  name="promise"
                  type="checkbox"
                  className="checkbox"
                  checked={promised}
                  onChange={(event) => {
                    setPromised(event.target.checked);
                    setError(null);
                  }}
                  disabled={pending}
                  required
                />
                <span className="document text-paper">I will follow the evidence, not the legend.</span>
              </label>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button type="submit" className="btn btn--ember" disabled={!ready} data-testid="sign-oath">
                  {pending ? 'Signing' : 'Sign the oath'}
                </button>
                <p id={`${id}-status`} className="mono text-paper" role="status" aria-live="polite">
                  {error}
                </p>
              </div>
              </form>
            </Frame>
          </Reveal>
        )}

        <Reveal className="mt-16">
          <DoubleRule as="h2" title="Keep the file" note="Optional" />
          <div className="mt-8">
            <KeepFile />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
