'use client';

import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { firebase } from '@/lib/firebase';
import { type CellarPlayer, GAME } from '@/lib/goldmaker/shape';
import { tally } from '@/lib/goldmaker/world';
import { SITE, SITE_HOME } from '@/lib/site/brand';

/** A Firestore timestamp, read without importing its type. */
function millis(stamp: unknown): number | null {
  return typeof (stamp as { toMillis?: unknown } | null)?.toMillis === 'function' ? (stamp as { toMillis: () => number }).toMillis() : null;
}

function howLong(from: unknown, to: unknown): string | null {
  const start = millis(from);
  const end = millis(to);
  if (start === null || end === null || end < start) return null;
  const minutes = Math.max(1, Math.round((end - start) / 60_000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const part = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  if (hours === 0) return part(minutes, 'minute');
  if (hours >= 48) return part(Math.round(hours / 24), 'day');
  return rest === 0 ? part(hours, 'hour') : `${part(hours, 'hour')} ${part(rest, 'minute')}`;
}

// What the Mint makes of each rank. None of it says what happened in the cellar.
const VERDICT: Record<string, string> = {
  'Master of the Mint': 'Nothing is written against your name. The Emperor has asked for it twice.',
  Warden: 'A mark or two, and nothing worse. The Mint has had worse wardens.',
  Assayer: 'It cost you something, and you got there.',
  Journeyman: 'The cellar gave you a good deal of trouble, and the captain has said so.',
  Apprentice: 'The captain will be telling this story for years.',
};

/**
 * The end of the room: the door opened from the outside, the rank the case
 * was closed at, and the account of what happened. The account is in the
 * visitor's own file. The function put it there when the report was right,
 * and not before.
 */
export function Ending({ player, onLookRound }: { player: CellarPlayer; onLookRound: () => void }) {
  const [count, setCount] = useState<{ entered: number; closed: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDoc(doc(firebase().db, 'stats', GAME))
      .then((snapshot) => {
        if (!cancelled) setCount({ entered: Number(snapshot.get('entered') ?? 0), closed: Number(snapshot.get('closed') ?? 0) });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const took = howLong(player.enteredAt, player.closedAt);
  const rank = player.rank ?? '';

  return (
    <div className="wrap py-12 md:py-16" data-testid="ending">
      <p className="label">File 002 · Closed</p>
      <h1 className="title title--1 mt-3" tabIndex={-1}>
        The door opens
      </h1>
      <p className="lede mt-6 max-w-[40ch]">
        The captain opens it himself, and stands in it looking at you for some time. {player.name}, you were shut in a
        cellar with one door, and you are not behind it.
      </p>

      <dl className="facts mt-10">
        <div>
          <dt className="label">Closed as</dt>
          <dd className="title title--3 mt-1" data-testid="rank">
            {rank}
          </dd>
        </div>
        <div>
          <dt className="label">Against your name</dt>
          <dd className="mt-1 text-[1.2rem]" data-testid="ending-marks">
            {player.marks > 0 ? (
              <>
                <span className="brass" aria-hidden="true">
                  {tally(player.marks)}{' '}
                </span>
                {player.marks} {player.marks === 1 ? 'mark' : 'marks'}
              </>
            ) : (
              'Nothing'
            )}
          </dd>
        </div>
        <div>
          <dt className="label">In the cellar</dt>
          <dd className="mt-1 text-[1.2rem]">{took ?? 'Long enough'}</dd>
        </div>
        <div>
          <dt className="label">Since 1593</dt>
          <dd className="mt-1 text-[1.2rem]" data-testid="ending-count">
            {count ? `${count.entered} shut in, ${count.closed} out` : '…'}
          </dd>
        </div>
      </dl>
      {VERDICT[rank] ? <p className="mute mt-4">{VERDICT[rank]}</p> : null}

      {player.account ? (
        <article className="vellum prose mt-12 max-w-[820px]" aria-labelledby="account-title" data-testid="account">
          <p className="label">For His Imperial Majesty</p>
          <h2 id="account-title" className="title title--2 mt-2">
            {player.account.title}
          </h2>
          <div className="mt-6">
            {player.account.body.split(/\n\s*\n/).map((paragraph, index) => (
              <p key={index} className={index === 0 ? 'dropcap' : undefined}>
                {paragraph}
              </p>
            ))}
          </div>
          <p className="vellum__note">Signed, {player.name}, Assay-Master to the Imperial Mint</p>
        </article>
      ) : null}

      <p className="mt-10 flex flex-wrap gap-3">
        {/* A plain anchor: the main website has a layout of its own. */}
        <a href={SITE_HOME} className="btn btn--solid" data-testid="ending-out">
          Back to {SITE.name}
        </a>
        <button type="button" className="btn" onClick={onLookRound} data-testid="ending-look">
          Go back in and look round
        </button>
      </p>
    </div>
  );
}
