'use client';

import { useEffect, useState } from 'react';
import { useSeconds } from '@/lib/clock';
import { ledgerCount } from '@/lib/format';
import type { OpenRoom, SealedRoom } from '@/lib/site/catalogue';
import { CLOCK_FAST_MINUTES } from '@/lib/site/practice';
import { type RoomCount, roomCountOnce } from '@/lib/site/stats';

const two = (n: number) => String(n).padStart(2, '0');

/**
 * The board behind the desk: what is open today, what is still sealed, how
 * many have gone in and come out, and what the lobby clock says.
 *
 * The two numbers are the first open room's own public counters, read when
 * the page loads. Until they arrive, and if they never do, the board shows
 * dashes, never a made-up number.
 *
 * The lobby clock is the visitor's own time, ten minutes fast, which is what
 * the brass plate under the clock in the photograph says it runs. Anyone who
 * checks it against their watch finds the plate is telling the truth. Until
 * the page has loaded in a browser there is no time to show.
 */
export function TodayBoard({ open, sealed }: { open: readonly OpenRoom[]; sealed: readonly SealedRoom[] }) {
  const [count, setCount] = useState<RoomCount | null>(null);
  const seconds = useSeconds();

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
  const shown = seconds > 0 ? new Date((seconds + CLOCK_FAST_MINUTES * 60) * 1000) : null;
  const reading = shown ? `${two(shown.getHours())}:${two(shown.getMinutes())}` : null;

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
        <div className="board__row">
          <dt>Lobby clock</dt>
          <dd data-testid="lobby-clock" data-reading={reading ?? undefined}>
            {/* role="timer" is announced only when asked for, never every minute. */}
            <time role="timer">{reading ?? '--:--'}</time>
          </dd>
        </div>
      </dl>
    </section>
  );
}
