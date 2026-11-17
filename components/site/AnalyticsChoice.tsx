'use client';

import { writeConsent } from '@/lib/consent';
import { useConsent } from '@/lib/use-consent';

const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Shows the visitor's answer about analytics on this browser, and lets them
 * change it. It is the same answer the rooms read and the same one a room's
 * own question records. Nothing is stored until a button is pressed.
 */
export function AnalyticsChoice() {
  const consent = useConsent();
  const choice = consent?.analytics ?? null;
  const when = consent ? day.format(new Date(consent.at)) : null;

  const standing =
    choice === 'granted'
      ? `Allowed on ${when}. Analytics is on in the rooms.`
      : choice === 'denied'
        ? `Refused on ${when}. Analytics is off.`
        : 'Not asked yet. Analytics is off.';

  return (
    <div className="notice" data-testid="analytics-choice">
      <p className="label">Analytics on this browser</p>
      <p className="mt-2 font-semibold" role="status" data-testid="analytics-standing">
        {standing}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className={choice === 'granted' ? 'btn' : 'btn btn--ghost'}
          aria-pressed={choice === 'granted'}
          onClick={() => writeConsent('granted')}
        >
          Allow
        </button>
        <button
          type="button"
          className={choice === 'denied' ? 'btn' : 'btn btn--ghost'}
          aria-pressed={choice === 'denied'}
          onClick={() => writeConsent('denied')}
        >
          Refuse
        </button>
      </div>
    </div>
  );
}
