'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { Clearance } from '@/components/gate/Clearance';
import { useProgress } from '@/components/providers/ProgressProvider';
import { roomIsOpen } from '@/lib/progress';
import type { RoomId } from '@/lib/rooms';

export interface GateProps {
  /**
   * What the visitor must have done to be here.
   *   threshold   solved the word on the landing page (guards /oath)
   *   oath        signed the oath
   *   a room id   that room is open to them (guards /file/{room})
   */
  need: 'threshold' | 'oath' | RoomId;
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
        : roomIsOpen(player, need);

  useEffect(() => {
    if (allowed === false) router.replace(progress.resumeRoute);
  }, [allowed, progress.resumeRoute, router]);

  if (allowed === true) return <>{children}</>;
  return <Clearance state={unreachable ? 'error' : allowed === false ? 'denied' : 'checking'} />;
}
