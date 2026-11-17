'use client';

import { useEffect, useState } from 'react';
import { describeCount, roomCountOnce } from '@/lib/site/stats';

/**
 * Who has gone into The Ashgrove File, and who has come out: one sentence,
 * read from the room's public counters when the page loads. If they cannot be
 * read the line stays empty. It never shows a number it does not have.
 */
export function LiveCount() {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    let gone = false;
    void roomCountOnce().then((count) => {
      if (count && !gone) setLine(describeCount(count));
    });
    return () => {
      gone = true;
    };
  }, []);

  return (
    <p className="quiet min-h-[1.6em] text-[0.9375rem]" aria-live="polite" data-testid="live-count">
      {line}
    </p>
  );
}
