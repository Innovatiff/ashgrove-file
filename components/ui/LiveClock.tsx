'use client';

import { useSeconds } from '@/lib/clock';
import { clockTime } from '@/lib/format';

/** The detective's own local time, HH:MM:SS, ticking once a second. */
export function LiveClock({ className }: { className?: string }) {
  const seconds = useSeconds();
  const now = seconds > 0 ? new Date(seconds * 1000) : null;

  return (
    // role="timer" is announced only when asked for, never every second.
    <time role="timer" className={className} dateTime={now ? now.toISOString() : undefined}>
      {now ? clockTime(now) : '--:--:--'}
    </time>
  );
}
