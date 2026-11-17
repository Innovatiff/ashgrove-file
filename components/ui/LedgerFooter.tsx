'use client';

import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useConsentChoice } from '@/components/providers/ConsentProvider';
import { useProgress } from '@/components/providers/ProgressProvider';
import { useSeconds } from '@/lib/clock';
import type { GlobalStats } from '@/lib/content';
import { firebase } from '@/lib/firebase';
import { elapsed, ledgerCount } from '@/lib/format';
import { ROOM_COUNT } from '@/lib/rooms';
import { SITE, SITE_HOME, WAY_OUT } from '@/lib/site/brand';

function Dot() {
  return (
    <span className="ledger__dot" aria-hidden="true">
      ·
    </span>
  );
}

/** Detectives entered and cases closed, live from stats/global. */
function useGlobalStats(): GlobalStats | null {
  const [stats, setStats] = useState<GlobalStats | null>(null);

  useEffect(() => {
    try {
      return onSnapshot(
        doc(firebase().db, 'stats', 'global'),
        (snapshot) =>
          setStats({
            entered: Number(snapshot.get('entered') ?? 0),
            closed: Number(snapshot.get('closed') ?? 0),
          }),
        () => setStats(null),
      );
    } catch {
      return;
    }
  }, []);

  return stats;
}

/**
 * The ledger at the foot of every page.
 *
 *   ROOMS 1/7 · TIME ON FILE 00:42:10 · ACCUSATIONS LEFT 3
 *   DETECTIVES ENTERED 0412 · CASES CLOSED 0037
 *
 * Once the case is closed the clock stops where it stood and the last entry
 * reads CASE CLOSED.
 *
 * The first line is this detective's own file. The second is everyone's,
 * and moves whenever anyone, anywhere, signs the oath or closes the case.
 *
 * Under the ledger, one quiet line leads back out: to the main website this
 * room belongs to, its other rooms and its small print. Those pages have a
 * layout of their own, so each of these links is a full page load. The last
 * entry says whether analytics is on, and opens that question again.
 */
export function LedgerFooter() {
  const { progress } = useProgress();
  const { consent, ask } = useConsentChoice();
  const stats = useGlobalStats();
  const now = useSeconds();
  const counting = consent?.analytics === 'granted';

  // A closed case stops the clock at the moment the right name was given.
  const until = progress.closedAt ? progress.closedAt.getTime() : now * 1000;
  const onFile = progress.oathAt && now > 0 ? elapsed(until - progress.oathAt.getTime()) : '--:--:--';

  return (
    <footer className="ledger">
      <div className="measure flex flex-col gap-2 py-5 lg:flex-row lg:items-center lg:justify-between">
        <p className="mono run" data-testid="ledger">
          <span>
            Rooms <span className="ember">{progress.solvedRooms.length}</span>/{ROOM_COUNT}
            <Dot />
          </span>
          <span>
            Time on file <span role="timer">{onFile}</span>
            {progress.hintPenalty > 0 ? <span className="muted"> +{progress.hintPenalty} min</span> : null}
            <Dot />
          </span>
          <span>{progress.closedAt ? <span className="ember">Case closed</span> : <>Accusations left {progress.accusationsLeft}</>}</span>
        </p>

        <p className="mono muted run" data-testid="global-stats">
          <span>
            Detectives entered {stats ? ledgerCount(stats.entered) : '----'}
            <Dot />
          </span>
          <span>Cases closed {stats ? ledgerCount(stats.closed) : '----'}</span>
        </p>
      </div>

      {/* Plain anchors: the main website has a layout of its own, so these
          are full page loads, and nothing of it is fetched until one is used. */}
      <nav className="ledger__site" aria-label={SITE.name}>
        <p className="measure mono muted run py-1.5" data-testid="site-line">
          <span>
            A room on <a href={SITE_HOME}>{SITE.name}</a>
            <Dot />
          </span>
          {WAY_OUT.map((item) => (
            <span key={item.href}>
              <a href={item.href}>{item.label}</a>
              <Dot />
            </span>
          ))}
          {/* Says whether analytics is on, and opens the question again. */}
          <span>
            <button type="button" onClick={ask} data-testid="consent-change">
              Analytics {counting ? 'on' : 'off'}
              <span className="visually-hidden">. Change</span>
            </button>
          </span>
        </p>
      </nav>
    </footer>
  );
}
