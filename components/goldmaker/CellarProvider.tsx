'use client';

import { onIdTokenChanged, type User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { firebase } from '@/lib/firebase';
import { type CellarContent, type CellarPlayer, GAME } from '@/lib/goldmaker/shape';
import { buildWorld, type World } from '@/lib/goldmaker/world';

/**
 * Where a visitor stands with this room.
 *
 *   finding   not known yet: the browser is still being asked who this is
 *   outside   nobody is signed in, or they have no file: they have not been shut in
 *   inside    they have a file. The cellar itself may still be on its way.
 *   lost      Firebase could not be reached at all
 */
export type Standing = 'finding' | 'outside' | 'inside' | 'lost';

export interface CellarState {
  standing: Standing;
  uid: string | null;
  /** games/goldmaker/players/{uid}, as the server last wrote it. */
  player: CellarPlayer | null;
  /** What is in the cellar for this visitor. null until it has arrived. */
  world: World | null;
}

const CellarContext = createContext<CellarState>({ standing: 'finding', uid: null, player: null, world: null });

/**
 * Listens to the visitor's own file and keeps every part of the room in step
 * with it. The browser only ever reads that file. The Cloud Function is the
 * only writer, so what arrives here is always the server's account of what
 * the visitor has done.
 *
 * Unlike The Ashgrove File, nobody is signed in just for arriving. A visitor
 * who is only reading the front page is given no account. One is made when
 * they sign the warrant (lib/goldmaker/api.ts), and a visitor who comes back
 * is recognised by the account their browser kept.
 */
export function CellarProvider({ children }: { children: ReactNode }) {
  // undefined: not known yet. null: nobody.
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [file, setFile] = useState<{ uid: string; player: CellarPlayer | null } | null>(null);
  const [content, setContent] = useState<CellarContent | null>(null);
  const [lost, setLost] = useState(false);

  useEffect(() => {
    try {
      const { auth } = firebase();
      return onIdTokenChanged(
        auth,
        (next) => setUser(next),
        () => setLost(true),
      );
    } catch (error) {
      console.error('[goldmaker] could not start', error);
      queueMicrotask(() => setLost(true));
      return;
    }
  }, []);

  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      doc(firebase().db, 'games', GAME, 'players', uid),
      (snapshot) => setFile({ uid, player: snapshot.exists() ? (snapshot.data() as CellarPlayer) : null }),
      (error) => {
        console.error('[goldmaker] could not read the file', error);
        setFile({ uid, player: null });
      },
    );
  }, [uid]);

  // A file read for one account is never shown under another.
  const mine = file && file.uid === uid ? file : null;
  const player = mine?.player ?? null;
  const shutIn = player !== null;

  // What is in the cellar is the same for everyone, and is read once. The
  // rules release it only to a visitor who has a file.
  useEffect(() => {
    if (!shutIn || content) return;
    let cancelled = false;
    let timer: number | undefined;
    const fetchContent = (attempt: number) => {
      getDoc(doc(firebase().db, 'games', GAME, 'content', 'cellar'))
        .then((snapshot) => {
          if (cancelled) return;
          if (snapshot.exists()) setContent(snapshot.data() as CellarContent);
          else setLost(true);
        })
        .catch((error) => {
          if (cancelled) return;
          console.error('[goldmaker] could not read the cellar', error);
          // The file can be written a moment before the rules can see it.
          if (attempt < 4) timer = window.setTimeout(() => fetchContent(attempt + 1), 600 * (attempt + 1));
          else setLost(true);
        });
    };
    fetchContent(0);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [shutIn, content]);

  const value = useMemo<CellarState>(() => {
    const standing: Standing = lost
      ? 'lost'
      : user === undefined || (user !== null && mine === null)
        ? 'finding'
        : player
          ? 'inside'
          : 'outside';
    return { standing, uid, player, world: content && player ? buildWorld(content, player) : null };
  }, [lost, user, mine, player, uid, content]);

  return <CellarContext.Provider value={value}>{children}</CellarContext.Provider>;
}

export function useCellar(): CellarState {
  return useContext(CellarContext);
}
