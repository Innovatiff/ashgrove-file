'use client';

import { useSeconds } from '@/lib/clock';
import { CLOCK_FAST_MINUTES } from '@/lib/site/practice';

const two = (n: number) => String(n).padStart(2, '0');

/**
 * The clock on the lobby wall. It shows the visitor's own time, ten minutes
 * fast, which is what the brass plate under it says it does. Anyone who
 * checks it against their watch finds the plate is telling the truth.
 *
 * The hands move once a minute, by being redrawn. Nothing is animated. Until
 * the page has loaded in a browser it stands at ten past ten.
 */
export function LobbyClock() {
  const seconds = useSeconds();
  const shown = seconds > 0 ? new Date((seconds + CLOCK_FAST_MINUTES * 60) * 1000) : null;
  const hours = shown ? shown.getHours() : 10;
  const minutes = shown ? shown.getMinutes() : 10;

  const ticks = Array.from({ length: 12 }, (_, index) => {
    const angle = (index * Math.PI) / 6;
    const quarter = index % 3 === 0;
    const from = quarter ? 66 : 70;
    return {
      key: index,
      x1: (100 + from * Math.sin(angle)).toFixed(2),
      y1: (100 - from * Math.cos(angle)).toFixed(2),
      x2: (100 + 77 * Math.sin(angle)).toFixed(2),
      y2: (100 - 77 * Math.cos(angle)).toFixed(2),
      quarter,
    };
  });

  return (
    <figure data-testid="lobby-clock" data-reading={shown ? `${two(hours)}:${two(minutes)}` : undefined}>
      <svg viewBox="0 0 200 200" className="dr" aria-hidden="true" focusable="false">
        <circle cx="100" cy="100" r="97" className="dr-brass" />
        <circle cx="100" cy="100" r="85" className="dr-card" />
        {ticks.map((tick) => (
          <line
            key={tick.key}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            className={tick.quarter ? 'dr-line' : 'dr-thin'}
          />
        ))}
        <line x1="100" y1="110" x2="100" y2="54" strokeWidth="4.5" className="clock__hand" transform={`rotate(${(hours % 12) * 30 + minutes * 0.5} 100 100)`} />
        <line x1="100" y1="114" x2="100" y2="30" strokeWidth="2.5" className="clock__hand" transform={`rotate(${minutes * 6} 100 100)`} />
        <circle cx="100" cy="100" r="5" className="dr-solid" />
        <circle cx="100" cy="100" r="1.800" fill="var(--brass)" />
      </svg>
      <figcaption className="visually-hidden">
        The lobby clock.{shown ? ` It reads ${two(hours)}:${two(minutes)}.` : ''}
      </figcaption>
    </figure>
  );
}
