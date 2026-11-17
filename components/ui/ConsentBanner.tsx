'use client';

import { useEffect, useId, useRef } from 'react';
import { useConsentChoice } from '@/components/providers/ConsentProvider';
import { useProgress } from '@/components/providers/ProgressProvider';
import { LEGAL } from '@/lib/site/brand';

const PRIVACY = LEGAL.find((item) => item.label === 'Privacy')?.href ?? '/privacy';

/**
 * The one question the file asks before it counts anything: may it use
 * Google Analytics?
 *
 * It is asked when a visitor is through the door, which is the first moment
 * analytics would have anything to count. The front page of the file sets no
 * cookie and needs no question, so a visitor who is only reading it is left
 * alone. It can be opened again at any time from the foot of the page.
 *
 * Both answers are the same size and the same weight. Until one of them is
 * given, analytics is off.
 */
export function ConsentBanner() {
  const { consent, asking, answer } = useConsentChoice();
  const { progress } = useProgress();
  const id = useId();

  const due = consent === null && progress.ready && progress.thresholdSolved;
  const open = asking || due;

  // While it is open, tell the page how tall it is. The stylesheet keeps that
  // much of the window clear whenever the browser scrolls something into
  // view, so a field or button that takes the focus is never left underneath.
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = bar.current;
    if (!open || !element) return;
    const root = document.documentElement;
    const measure = () => root.style.setProperty('--consent-height', `${Math.ceil(element.getBoundingClientRect().height)}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--consent-height');
    };
  }, [open]);

  if (!open) return null;

  const standing =
    consent === null ? null : consent.analytics === 'granted' ? 'At the moment you allow it.' : 'At the moment you refuse it.';

  return (
    <aside ref={bar} className="consent" aria-labelledby={id} data-testid="consent">
      <div className="measure flex flex-col gap-x-12 gap-y-4 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p id={id} className="mono mono--lg text-paper">
            May the archive keep count?
          </p>
          <p className="mt-2 max-w-[78ch] text-paper">
            Google Analytics would count the rooms you solve and the hints you take. It sets cookies to do it. You can
            play without it, and it stays off unless you allow it.{' '}
            {standing ? <span data-testid="consent-standing">{standing} </span> : null}
            <a href={PRIVACY} className="link">
              What is kept
            </a>
          </p>
        </div>
        <div className="flex flex-none gap-3">
          <button type="button" className="btn flex-1 lg:flex-none" onClick={() => answer('granted')} data-testid="consent-allow">
            Allow
          </button>
          <button type="button" className="btn flex-1 lg:flex-none" onClick={() => answer('denied')} data-testid="consent-refuse">
            Refuse
          </button>
        </div>
      </div>
    </aside>
  );
}
