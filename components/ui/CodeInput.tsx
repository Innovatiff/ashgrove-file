'use client';

import { type FormEvent, useEffect, useId, useState } from 'react';
import { useSeconds } from '@/lib/clock';
import { cx } from '@/lib/format';

export type CodeOutcome =
  /** The code was right. */
  | { status: 'correct'; message?: string }
  /** The code was wrong. */
  | { status: 'wrong'; message: string; triesLeft?: number }
  /** Too many tries: the input locks until the wait is over. */
  | { status: 'blocked'; message: string; retryAfterSeconds: number }
  /** Something else went wrong. The player may try again. */
  | { status: 'error'; message: string };

export interface CodeInputProps {
  /** The visible label, e.g. "STATE THE WORD THAT LETS YOU IN". */
  label: string;
  /** time: digits are set as HH:MM while typing. number: figures only. text: anything. */
  format?: 'text' | 'time' | 'number';
  submitLabel?: string;
  placeholder?: string;
  maxLength?: number;
  /** Checks the code. Runs on the server in practice: nothing here knows the answer. */
  onSubmit: (value: string) => Promise<CodeOutcome>;
  /** When set, the input is locked and shows this: the gate is already open. */
  solvedValue?: string | null;
  disabled?: boolean;
  className?: string;
}

function asTime(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

function asNumber(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 9);
}

function Countdown({ until, onDone }: { until: number; onDone: () => void }) {
  const now = useSeconds();
  const left = Math.max(0, until - now);
  const finished = now > 0 && left === 0;
  useEffect(() => {
    if (finished) onDone();
  }, [finished, onDone]);
  return <>Wait {left} seconds.</>;
}

/**
 * One labelled mono input and one button. It formats, submits and reports.
 * It never decides whether a code is right.
 */
export function CodeInput({
  label,
  format = 'text',
  submitLabel = 'Submit',
  placeholder,
  maxLength = 64,
  onSubmit,
  solvedValue,
  disabled = false,
  className,
}: CodeInputProps) {
  const id = useId();
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<CodeOutcome | null>(null);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);

  const solved = typeof solvedValue === 'string';
  const locked = disabled || solved || pending || blockedUntil !== null;
  const complete = format === 'time' ? /^\d{2}:\d{2}$/.test(value) : value.trim().length > 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked || !complete) return;
    setPending(true);
    setOutcome(null);
    let result: CodeOutcome;
    try {
      result = await onSubmit(value.trim());
    } catch {
      result = { status: 'error', message: 'The archive is not answering. Try again.' };
    }
    setPending(false);
    setOutcome(result);
    if (result.status === 'blocked') {
      setBlockedUntil(Math.floor(Date.now() / 1000) + result.retryAfterSeconds);
    }
  }

  return (
    <form onSubmit={submit} className={cx('flex flex-col gap-3', className)} noValidate>
      <label htmlFor={`${id}-code`} className="mono mono--lg">
        {label}
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={`${id}-code`}
          name="code"
          className="field sm:flex-1"
          type="text"
          value={solved ? solvedValue : value}
          onChange={(event) => {
            const typed = event.target.value;
            setValue(format === 'time' ? asTime(typed) : format === 'number' ? asNumber(typed) : typed);
            if (outcome?.status === 'wrong' || outcome?.status === 'error') setOutcome(null);
          }}
          placeholder={placeholder ?? (format === 'time' ? 'HH:MM' : undefined)}
          inputMode={format === 'text' ? 'text' : 'numeric'}
          maxLength={format === 'time' ? 5 : maxLength}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={disabled || solved || blockedUntil !== null}
          readOnly={pending}
          aria-describedby={`${id}-status`}
          aria-invalid={outcome?.status === 'wrong' ? true : undefined}
        />
        <button type="submit" className="btn btn--ember" disabled={locked || !complete}>
          {pending ? 'Checking' : submitLabel}
        </button>
      </div>

      <p id={`${id}-status`} role="status" aria-live="polite" className="mono min-h-[1.6em]" data-testid="code-status">
        {blockedUntil !== null ? (
          <span className="text-paper">
            Ten guesses in a minute is not detective work.{' '}
            <Countdown
              until={blockedUntil}
              onDone={() => {
                setBlockedUntil(null);
                setOutcome(null);
              }}
            />
          </span>
        ) : outcome?.status === 'wrong' ? (
          <>
            <span className="text-paper">{outcome.message}</span>
            {typeof outcome.triesLeft === 'number' ? (
              <span className="muted">
                {' '}
                {outcome.triesLeft} {outcome.triesLeft === 1 ? 'try' : 'tries'} left this minute.
              </span>
            ) : null}
          </>
        ) : outcome ? (
          <span className="text-paper">{outcome.message}</span>
        ) : null}
      </p>
    </form>
  );
}
