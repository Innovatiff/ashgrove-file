'use client';

import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { firebase } from '@/lib/firebase';
import { NO_PROGRESS, type PlayerDoc, type Progress, readProgress } from '@/lib/progress';

export interface ProgressState {
  /** The raw players/{uid} document, or null if the visitor has no file yet. */
  player: PlayerDoc | null;
  /** The same document, read into what the interface needs. */
  progress: Progress;
  /** True if sign-in failed, so nothing can ever load. */
  unreachable: boolean;
}

const ProgressContext = createContext<ProgressState>({ player: null, progress: NO_PROGRESS, unreachable: false });

/**
 * Listens to players/{uid} and keeps every page in step with it. The browser
 * only ever reads this document. Cloud Functions are the only writer, so what
 * arrives here is always the server's view of the case.
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const { uid, status } = useAuth();
  const [latest, setLatest] = useState<{ uid: string; player: PlayerDoc | null } | null>(null);

  useEffect(() => {
    if (!uid) return;
    const { db } = firebase();
    return onSnapshot(
      doc(db, 'players', uid),
      (snapshot) => setLatest({ uid, player: snapshot.exists() ? (snapshot.data() as PlayerDoc) : null }),
      (error) => {
        console.error('[ashgrove] could not read the file', error);
        setLatest({ uid, player: null });
      },
    );
  }, [uid]);

  const value = useMemo<ProgressState>(() => {
    // A snapshot for a previous account must never be shown under a new one.
    const current = latest && latest.uid === uid ? latest : null;
    return {
      player: current?.player ?? null,
      progress: current ? readProgress(current.player) : NO_PROGRESS,
      unreachable: status === 'error',
    };
  }, [latest, uid, status]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressState {
  return useContext(ProgressContext);
}
