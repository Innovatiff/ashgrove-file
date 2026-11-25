import type { ReactNode } from 'react';

/**
 * The signs of the seven planets, which are also the signs of the seven
 * metals. They are drawn here and not typed: as characters they turn into
 * coloured pictures on some phones and into empty boxes on others.
 */
const SIGNS: Record<string, { name: string; drawing: ReactNode }> = {
  sun: {
    name: 'the Sun',
    drawing: (
      <>
        <circle cx="16" cy="16" r="10" />
        <circle cx="16" cy="16" r="1.8" fill="currentColor" stroke="none" />
      </>
    ),
  },
  moon: {
    name: 'the Moon',
    drawing: <path d="M19.5 6.47A11 11 0 1 0 19.5 25.53 9.85 9.85 0 0 1 19.5 6.47Z" />,
  },
  mercury: {
    name: 'Mercury',
    drawing: (
      <>
        <circle cx="16" cy="14" r="5" />
        <path d="M10.5 4.5a5.5 5.5 0 0 0 11 0M16 19v10M12 24.5h8" />
      </>
    ),
  },
  venus: {
    name: 'Venus',
    drawing: (
      <>
        <circle cx="16" cy="11" r="6.5" />
        <path d="M16 17.5V29M11 23.5h10" />
      </>
    ),
  },
  mars: {
    name: 'Mars',
    drawing: (
      <>
        <circle cx="13" cy="19" r="7.5" />
        <path d="M18.3 13.7 26.5 5.5M19.5 5.5h7v7" />
      </>
    ),
  },
  jupiter: {
    name: 'Jupiter',
    drawing: <path d="M7 9.5C7 4.5 15 4.5 15 10c0 4.5-5.5 7-8 11.5h18M20.5 7v21" />,
  },
  saturn: {
    name: 'Saturn',
    drawing: <path d="M12 4v18M7 9h10M12 14.5c3-4.5 9-3.5 9 1.5 0 4-3 6-3 9 0 2 2 3.5 5 2" />,
  },
};

export function signName(id: string): string {
  return SIGNS[id]?.name ?? id;
}

/** One sign. It is decoration unless `labelled`: the page beside it always names the planet. */
export function Sign({ id, className = 'sign', labelled = false }: { id: string; className?: string; labelled?: boolean }) {
  const sign = SIGNS[id];
  if (!sign) return null;
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(labelled ? { role: 'img', 'aria-label': `The sign of ${sign.name}` } : { 'aria-hidden': true })}
    >
      {sign.drawing}
    </svg>
  );
}
