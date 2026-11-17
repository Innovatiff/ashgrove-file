'use client';

import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import type { EvidenceContent, RoomContent, VerdictContent } from '@/lib/content';
import { firebase } from '@/lib/firebase';
import { type RoomId, VERDICT } from '@/lib/rooms';

export type FileState<T> =
  | { status: 'loading' }
  | { status: 'ready'; room: T }
  /** The document does not exist: the database has not been seeded. */
  | { status: 'missing' }
  /** firestore.rules refused: the room is not open to this detective. */
  | { status: 'denied' }
  | { status: 'error' };

export type RoomState = FileState<RoomContent>;

/**
 * Loads rooms/{id} from Firestore. A room's documents, prompt and image
 * names are not in the bundle: they arrive here, and only if the rules agree
 * that this detective has solved the room before it.
 */
function useFileDocument<T>(id: string): FileState<T> {
  const { uid } = useAuth();
  const [loaded, setLoaded] = useState<{ key: string; state: FileState<T> } | null>(null);
  const key = `${uid ?? ''}:${id}`;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    const settle = (state: FileState<T>) => {
      if (!cancelled) setLoaded({ key, state });
    };

    getDoc(doc(firebase().db, 'rooms', id))
      .then((snapshot) =>
        settle(snapshot.exists() ? { status: 'ready', room: snapshot.data() as T } : { status: 'missing' }),
      )
      .catch((error: { code?: string }) => {
        settle({ status: error?.code === 'permission-denied' ? 'denied' : 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [uid, id, key]);

  return loaded?.key === key ? loaded.state : { status: 'loading' };
}

export function useRoom(roomId: RoomId): RoomState {
  return useFileDocument<RoomContent>(roomId);
}

/**
 * Loads the papers for the accusation: the five who can be named, and what
 * each of them said. The rules release it when the seventh room is solved.
 */
export function useVerdict(): FileState<VerdictContent> {
  return useFileDocument<VerdictContent>(VERDICT);
}

/**
 * Loads the evidence cards a detective has earned. evidence/{id} is readable
 * only when that id is already in their players document, which only the
 * checkAnswer function can write.
 */
export function useEvidence(ids: readonly string[]): Record<string, EvidenceContent> {
  const { uid } = useAuth();
  const [cards, setCards] = useState<Record<string, EvidenceContent>>({});
  const wanted = ids.join('|');

  useEffect(() => {
    if (!uid || wanted === '') return;
    let cancelled = false;

    for (const id of wanted.split('|')) {
      getDoc(doc(firebase().db, 'evidence', id))
        .then((snapshot) => {
          if (cancelled || !snapshot.exists()) return;
          setCards((known) => ({ ...known, [`${uid}:${id}`]: snapshot.data() as EvidenceContent }));
        })
        .catch(() => {
          // Not earned, or offline. The card simply does not appear.
        });
    }

    return () => {
      cancelled = true;
    };
  }, [uid, wanted]);

  const mine: Record<string, EvidenceContent> = {};
  for (const id of ids) {
    const card = cards[`${uid}:${id}`];
    if (card) mine[id] = card;
  }
  return mine;
}
