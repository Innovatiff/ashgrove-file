import { useSyncExternalStore } from 'react';

/**
 * One shared ticker for everything on the page that shows the time: the
 * header clock and the ledger's "time on file". It only runs while something
 * is listening, and it reports whole seconds.
 */

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let second = 0;

function read(): number {
  return Math.floor(Date.now() / 1000);
}

function tick(): void {
  const now = read();
  if (now === second) return;
  second = now;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  timer ??= setInterval(tick, 200);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function snapshot(): number {
  if (second === 0) second = read();
  return second;
}

/**
 * The current time in whole seconds since the epoch, updated every second.
 * Returns 0 while prerendering, so server and first client render agree.
 */
export function useSeconds(): number {
  return useSyncExternalStore(subscribe, snapshot, () => 0);
}
