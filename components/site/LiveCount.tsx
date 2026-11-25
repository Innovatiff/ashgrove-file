'use client';

import { useEffect, useState } from 'react';
import type { RoomTally } from '@/lib/site/catalogue';
import { describeCount, roomCountOnce } from '@/lib/site/stats';

/**
 * Who has gone into a room, and who has come out: one sentence in the room's
 * own words, read from its public counters when the page loads. If they
 * cannot be read the line stays empty. It never shows a number it does not
 * have.
 */
export function LiveCount({ stats, tally }: { stats: string; tally: RoomTally }) {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    let gone = false;
    void roomCountOnce(stats).then((count) => {
      if (count && !gone) setLine(describeCount(count, tally));
    });
    return () => {
      gone = true;
    };
  }, [stats, tally]);

  return (
    <p className="quiet min-h-[1.6em] text-[0.9375rem]" aria-live="polite" data-testid="live-count">
      {line}
    </p>
  );
}
