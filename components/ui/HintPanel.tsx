'use client';

import { useEffect, useState } from 'react';
import { Frame } from '@/components/ui/Frame';
import { describeFailure, takeHint, type TakeHintResult } from '@/lib/api';
import { track } from '@/lib/firebase';
import { cx } from '@/lib/format';
import { HINT_PENALTY_MINUTES, type RoomId, roomNumeral } from '@/lib/rooms';

const NUMERALS = ['I', 'II', 'III'] as const;

export interface HintPanelProps {
  room: RoomId;
  /** The highest tier already taken, from players/{uid}.hintsTaken. */
  taken: number;
  /** Total minutes of hint penalty on the file. */
  penalty?: number;
  /** A solved room sells no new hints. Hints already taken stay readable. */
  closed?: boolean;
  /** Fetches one hint. Defaults to the takeHint Cloud Function. */
  fetchHint?: (room: RoomId, tier: number) => Promise<TakeHintResult>;
  className?: string;
}

/**
 * Three hints, opened one at a time, each behind a confirmation.
 *
 * The texts are not in this component, not in the bundle and not readable
 * from Firestore. Each one arrives from the takeHint function, which also
 * adds 5, 10 or 20 minutes to the detective's time. A hint that has been paid
 * for is fetched again on reload at no cost.
 */
export function HintPanel({ room, taken, penalty = 0, closed = false, fetchHint = takeHint, className }: HintPanelProps) {
  const [texts, setTexts] = useState<Record<number, string>>({});
  const [confirming, setConfirming] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hints paid for earlier (another visit, another device) are read back free.
  useEffect(() => {
    let cancelled = false;
    for (let tier = 1; tier <= taken; tier++) {
      if (texts[tier] !== undefined) continue;
      fetchHint(room, tier)
        .then((hint) => {
          if (!cancelled) setTexts((known) => ({ ...known, [tier]: hint.text }));
        })
        .catch(() => {
          // Leave the row saying it is being retrieved: the next render retries.
        });
    }
    return () => {
      cancelled = true;
    };
    // `texts` is read only to skip tiers that are already loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, taken, fetchHint]);

  async function open(tier: number) {
    setPending(tier);
    setError(null);
    try {
      const hint = await fetchHint(room, tier);
      setTexts((known) => ({ ...known, [tier]: hint.text }));
      setConfirming(null);
      if (hint.penaltyAdded > 0) void track('hint_taken', { room, tier });
    } catch (failure) {
      setError(describeFailure(failure).message);
    } finally {
      setPending(null);
    }
  }

  return (
    <Frame as="section" label="Hints" mark={`Room ${roomNumeral(room)}`} className={cx('px-5 pb-5 pt-7', className)} aria-label="Hints">
      <p className="text-paper">Three hints. Each one is added to your time. Take them in order, or not at all.</p>

      <ol className="mt-5 border-t border-line">
        {HINT_PENALTY_MINUTES.map((minutes, index) => {
          const tier = index + 1;
          const text = texts[tier];
          const isTaken = tier <= taken || text !== undefined;
          const isNext = !isTaken && tier === taken + 1 && !closed;

          return (
            <li key={tier} className="border-b border-line py-4">
              <div className="mono flex items-center justify-between gap-4">
                <span className={isTaken ? 'text-paper' : 'muted'}>Hint {NUMERALS[index]}</span>
                <span className="muted">
                  {isTaken ? `${minutes} min added` : `+${minutes} min`}
                </span>
              </div>

              {isTaken ? (
                <p className="document mt-3 text-paper" data-testid={`hint-${tier}`}>
                  {text ?? 'Retrieving from the file.'}
                </p>
              ) : isNext && confirming === tier ? (
                <div className="mt-3">
                  <p className="text-paper">
                    This adds {minutes} minutes to your time. It stays on the file.
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <button type="button" className="btn btn--ember" disabled={pending !== null} onClick={() => open(tier)}>
                      {pending === tier ? 'Opening' : `Confirm · +${minutes} min`}
                    </button>
                    <button type="button" className="btn" disabled={pending !== null} onClick={() => setConfirming(null)}>
                      Keep looking
                    </button>
                  </div>
                </div>
              ) : isNext ? (
                <button
                  type="button"
                  className="btn mt-3"
                  onClick={() => {
                    setError(null);
                    setConfirming(tier);
                  }}
                >
                  Open hint {NUMERALS[index]}
                </button>
              ) : (
                <p className="mono muted mt-3">
                  {closed ? 'Not taken' : `Sealed until hint ${NUMERALS[index - 1] ?? 'I'} is open`}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mono muted mt-4" role="status" aria-live="polite">
        {error ? <span className="text-paper">{error}</span> : <>Hint penalty on file: {penalty} min</>}
      </p>
    </Frame>
  );
}
