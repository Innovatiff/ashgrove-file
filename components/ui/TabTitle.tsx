'use client';

import { useEffect } from 'react';

const AWAY = 'The file is still open.';

/**
 * When the tab loses focus its title becomes "The file is still open."
 * The real title comes back the moment the detective does.
 */
export function TabTitle() {
  useEffect(() => {
    let saved: string | null = null;

    const leave = () => {
      if (document.title === AWAY) return;
      saved = document.title;
      document.title = AWAY;
    };
    const back = () => {
      // If a navigation changed the title while away, leave the new one alone.
      if (saved !== null && document.title === AWAY) document.title = saved;
      saved = null;
    };
    const visibility = () => (document.hidden ? leave() : back());

    window.addEventListener('blur', leave);
    window.addEventListener('focus', back);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', back);
      document.removeEventListener('visibilitychange', visibility);
      back();
    };
  }, []);

  return null;
}
