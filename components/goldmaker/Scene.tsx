'use client';

import { type CSSProperties, useEffect, useRef } from 'react';
import { Photo } from '@/components/goldmaker/Photo';
import type { ThingDef, ViewDef } from '@/lib/goldmaker/shape';

export interface SceneProps {
  view: ViewDef;
  things: ThingDef[];
  selected: string | null;
  /** A thing in the list that has the pointer or the focus: its mark is shown. */
  hinted: string | null;
  onSelect: (thing: string) => void;
}

/**
 * Where the visitor is standing: one photograph, with everything that can be
 * looked at marked on it.
 *
 * The picture keeps its height whatever the screen. On a wide screen all of
 * it shows. On a narrow one it is wider than the window and is slid from
 * side to side, which is how a room is looked round.
 *
 * The marks are for a pointer or a finger. The same things are listed in
 * words under the picture, and that list is what the keyboard and a screen
 * reader use, so nobody has to step through every thing twice. A thing in
 * the list shows its mark here while it has the focus.
 */
export function Scene({ view, things, selected, hinted, onSelect }: SceneProps) {
  const pan = useRef<HTMLDivElement>(null);
  const ratio = view.picture.width / view.picture.height;

  // On arriving somewhere, look straight ahead: the middle of the picture.
  useEffect(() => {
    const element = pan.current;
    if (element) element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
  }, [view.id]);

  // When a thing is chosen from the list, turn toward it.
  useEffect(() => {
    const element = pan.current;
    if (!element || !selected) return;
    const spot = element.querySelector<HTMLElement>(`[data-thing="${selected}"]`);
    if (!spot || element.scrollWidth <= element.clientWidth) return;
    const centre = spot.offsetLeft + spot.offsetWidth / 2;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollTo({ left: Math.max(0, centre - element.clientWidth / 2), behavior: reduce ? 'auto' : 'smooth' });
  }, [selected]);

  return (
    <section className="scene" aria-label={`${view.name}, as it looks`} data-testid={`scene-${view.id}`}>
      <div className="scene__pan" ref={pan}>
        <div className="scene__frame" style={{ '--ratio': `${view.picture.width} / ${view.picture.height}` } as CSSProperties}>
          <Photo picture={view.picture} sizes={`${Math.round(ratio * 600)}px`} className="scene__picture" priority />
          <div aria-hidden="true">
            {things.map((thing) => (
              <button
                key={thing.id}
                type="button"
                tabIndex={-1}
                className="spot"
                style={{ left: `${thing.rect.x}%`, top: `${thing.rect.y}%`, width: `${thing.rect.w}%`, height: `${thing.rect.h}%` }}
                onClick={() => onSelect(thing.id)}
                data-thing={thing.id}
                data-chosen={selected === thing.id}
                data-hinted={hinted === thing.id}
                data-testid={`spot-${thing.id}`}
              >
                <span className="spot__name">{thing.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="scene__hint">Slide the picture to look round.</p>
    </section>
  );
}
