'use client';

import { useState } from 'react';
import { Bird } from '@/components/goldmaker/Bird';
import { describeFailure, setLock } from '@/lib/goldmaker/api';
import { type LockDef, MISSED_LOCK_MARKS } from '@/lib/goldmaker/shape';

/** Faces that are colours of enamel, and the colour each one is. */
const ENAMEL: Record<string, string> = {
  black: 'var(--ring-black)',
  white: 'var(--ring-white)',
  gold: 'var(--ring-gold)',
  red: 'var(--ring-red)',
  green: 'var(--ring-green)',
  blue: 'var(--ring-blue)',
};

/** What a wrong setting costs, as it is said. */
const COST = `${MISSED_LOCK_MARKS} ${MISSED_LOCK_MARKS === 1 ? 'mark' : 'marks'}`;
const COST_IS = MISSED_LOCK_MARKS === 1 ? 'is' : 'are';

export interface LockProps {
  lock: LockDef;
  /** Called with what happened when it opens. */
  onOpen: (text: string, gained: string[]) => void;
}

/**
 * A lock that is set by turning rings. Nothing is typed. Each ring is turned
 * to one of its faces, and the whole setting is tried at once.
 *
 * Which setting opens it is not in the page: the setting is sent to the
 * function, which answers yes or no and nothing else. A setting that does
 * not open it is marked against the visitor's name, and the lock says so
 * before anything is tried.
 */
export function Lock({ lock, onOpen }: LockProps) {
  const [faces, setFaces] = useState<number[]>(() => lock.wheels.map(() => 0));
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<string | null>(null);

  const turn = (wheel: number, by: number) => {
    setSaid(null);
    setFaces((current) => current.map((face, index) => (index === wheel ? (face + by + lock.faces.length) % lock.faces.length : face)));
  };

  const attempt = async () => {
    if (busy) return;
    setBusy(true);
    setSaid(null);
    try {
      const result = await setLock(
        lock.id,
        faces.map((face) => lock.faces[face]?.id ?? ''),
      );
      if (result.open) onOpen(result.text ?? '', result.gained ?? []);
      else {
        const marked = (result.marksAdded ?? 0) > 0 ? ` ${COST} ${COST_IS} written against your name.` : '';
        setSaid(`It does not give.${marked}${result.triesLeft > 0 ? '' : ' Leave it a minute before you try another.'}`);
      }
    } catch (error) {
      setSaid(describeFailure(error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lock" data-testid={`lock-${lock.id}`}>
      <p className="label brass">{lock.inscription}</p>
      <div className="lock__rings mt-4">
        {lock.wheels.map((wheel, index) => {
          const face = lock.faces[faces[index] ?? 0];
          const enamel = face ? ENAMEL[face.id] : undefined;
          return (
            <div key={wheel.label} className="ring" role="group" aria-label={wheel.label}>
              {wheel.bird ? <Bird id={wheel.bird} size={52} labelled /> : null}
              <button type="button" className="ring__turn" onClick={() => turn(index, -1)} aria-label="Turn it back" data-testid={`ring-${index}-back`}>
                <svg viewBox="0 0 16 10" width="16" height="10" aria-hidden="true">
                  <path d="M1 9l7-7 7 7" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              <output className={enamel ? 'ring__face' : 'ring__face ring__face--numeral'} aria-live="polite" data-testid={`ring-${index}-face`}>
                {enamel ? <span className="swatch" style={{ background: enamel }} aria-hidden="true" /> : null}
                <span>{face?.label}</span>
              </output>
              <button type="button" className="ring__turn" onClick={() => turn(index, 1)} aria-label="Turn it on" data-testid={`ring-${index}-on`}>
                <svg viewBox="0 0 16 10" width="16" height="10" aria-hidden="true">
                  <path d="M1 1l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button type="button" className="btn btn--solid" onClick={attempt} disabled={busy} data-testid={`lock-${lock.id}-try`}>
          {busy ? 'Trying it' : 'Try this setting'}
        </button>
        <span role="status" data-testid={`lock-${lock.id}-said`}>
          {said}
        </span>
      </p>
      <p className="mute mt-3 text-[1rem]" data-testid={`lock-${lock.id}-cost`}>
        A setting that does not open it is written against your name: {COST}.
      </p>
    </div>
  );
}
