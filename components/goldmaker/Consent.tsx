'use client';

import { useEffect, useId, useRef } from 'react';
import { useCellar } from '@/components/goldmaker/CellarProvider';
import { useConsentChoice } from '@/components/providers/ConsentProvider';
import { LEGAL } from '@/lib/site/brand';

const PRIVACY = LEGAL.find((item) => item.label === 'Privacy')?.href ?? '/privacy';

/**
 * The one question the room asks before it counts anything: may it use
 * Google Analytics?
 *
 * It is the same question every room asks, and one answer serves the whole
 * site. Here it is asked once a visitor has been shut in, which is the first
 * moment there is anything to count. The front page sets no cookie, signs
 * nobody in and needs no question. It can be opened again at any time from
 * the foot of the page.
 *
 * Both answers are the same size and the same weight. Until one of them is
 * given, analytics is off.
 */
export function Consent() {
  const { consent, asking, answer } = useConsentChoice();
  const { standing } = useCellar();
  const id = useId();

  const due = consent === null && standing === 'inside';
  const open = asking || due;

  // While it is open, tell the page how tall it is, so that nothing that
  // takes the focus is ever left underneath it.
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

  const standingAnswer =
    consent === null ? null : consent.analytics === 'granted' ? 'At the moment you allow it.' : 'At the moment you refuse it.';

  return (
    <aside ref={bar} className="consent" aria-labelledby={id} data-testid="consent">
      <div className="wrap flex flex-col gap-x-12 gap-y-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p id={id} className="brass text-[1.25rem]">
            May the Mint keep count?
          </p>
          <p className="mt-1 max-w-[76ch]">
            Google Analytics would count that you went in, the questions you ask the captain and whether you get out.
            It sets cookies to do it. You can play without it, and it stays off unless you allow it.{' '}
            {standingAnswer ? <span data-testid="consent-standing">{standingAnswer} </span> : null}
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
