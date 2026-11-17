'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { Clearance } from '@/components/gate/Clearance';
import { useProgress } from '@/components/providers/ProgressProvider';
import { roomIsOpen } from '@/lib/progress';
import type { RoomId } from '@/lib/rooms';

/** How long the gate waits for the file to catch up before it turns a visitor away. */
const GRACE_MS = 1500;

export interface GateProps {
  /**
   * What the visitor must have done to be here.
   *   threshold   solved the word on the landing page (guards /oath)
   *   oath        signed the oath
   *   a room id   that room is open to them (guards /file/{room})
   *   verdict     all seven rooms are solved (guards /verdict)
   */
  need: 'threshold' | 'oath' | 'verdict' | RoomId;
  children: ReactNode;
}

/**
 * Client-side gating. /oath stays locked until the Threshold is solved,
 * /file/* until the oath is signed, and a locked room sends the visitor to
 * the last room that is open to them.
 *
 * This is a courtesy, not the lock. A visitor who removes this component
 * still gets nothing: room documents are served by Firestore only when
 * firestore.rules allows it, and only a Cloud Function can change progress.
 */
export function Gate({ need, children }: GateProps) {
  const { player, progress, unreachable } = useProgress();
  const router = useRouter();

  const allowed = !progress.ready
    ? null
    : need === 'threshold'
      ? progress.thresholdSolved
      : need === 'oath'
        ? progress.oathSigned
        : need === 'verdict'
          ? progress.roomsDone
          : roomIsOpen(player, need);

  // A page can be reached a moment before the news that unlocks it. The door
  // opens when checkAnswer replies; the file on this page is a live copy that
  // hears of it separately, and now and then the reply wins. So nobody is
  // turned away at once: the gate waits, and lets them in if the file catches
  // up while it does.
  const [turnedAway, setTurnedAway] = useState(false);
  useEffect(() => {
    if (allowed !== false) return;
    const timer = window.setTimeout(() => {
      setTurnedAway(true);
      router.replace(progress.resumeRoute);
    }, GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [allowed, progress.resumeRoute, router]);

  if (allowed === true) return <>{children}</>;
  return <Clearance state={unreachable ? 'error' : allowed === false && turnedAway ? 'denied' : 'checking'} />;
}
