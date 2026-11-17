'use client';

import { useEffect, useState } from 'react';
import { ledgerCount } from '@/lib/format';
import type { OpenRoom, SealedRoom } from '@/lib/site/catalogue';
import { type RoomCount, roomCountOnce } from '@/lib/site/stats';

/**
 * The board behind the desk: what is open today, what is still sealed, and
 * how many have gone in and come out. The two numbers are the first open
 * room's own public counters, read when the page loads. Until they arrive,
 * and if they never do, the board shows dashes, never a made-up number.
 */
export function TodayBoard({ open, sealed }: { open: readonly OpenRoom[]; sealed: readonly SealedRoom[] }) {
  const [count, setCount] = useState<RoomCount | null>(null);

  useEffect(() => {
    let gone = false;
    void roomCountOnce().then((found) => {
      if (found && !gone) setCount(found);
    });
    return () => {
      gone = true;
    };
  }, []);

  const first = sealed[0]?.number;
  const last = sealed[sealed.length - 1]?.number;

  return (
    <section className="board" aria-label="Today’s board" data-testid="today-board">
      <h2 className="board__title">Today</h2>
      <ul>
        {open.map((room) => (
          <li key={room.number} className="board__row">
            <span>
              {room.number} · {room.title}
            </span>
            <span>Open</span>
          </li>
        ))}
        {first ? (
          <li className="board__row board__row--sealed">
            <span>{first === last ? first : `${first} to ${last}`}</span>
            <span>Sealed</span>
          </li>
        ) : null}
      </ul>
      <dl className="board__tally">
        <div className="board__row">
          <dt>Gone in</dt>
          <dd data-testid="board-entered">{count ? ledgerCount(count.entered) : '----'}</dd>
        </div>
        <div className="board__row">
          <dt>Solved it</dt>
          <dd data-testid="board-closed">{count ? ledgerCount(count.closed) : '----'}</dd>
        </div>
      </dl>
    </section>
  );
}
