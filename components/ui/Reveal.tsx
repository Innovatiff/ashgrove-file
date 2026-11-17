'use client';

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/format';

/**
 * THE ONLY MOTION, part one.
 *
 * Opacity 0 to 1 and translateY 16px to 0, over 700ms, on
 * cubic-bezier(.2,.7,.2,1), once per element. Siblings that enter together
 * are staggered by 80ms in document order. Switched off entirely under
 * prefers-reduced-motion (in CSS, so it holds even before this code runs).
 */

const STAGGER_MS = 80;

type Notify = (delayMs: number) => void;
const waiting = new WeakMap<Element, Notify>();
let observer: IntersectionObserver | undefined;

function sharedObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      const entering = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target);
      if (entering.length === 0) return;

      const families = new Map<Element | null, Element[]>();
      for (const element of entering) {
        const family = families.get(element.parentElement) ?? [];
        family.push(element);
        families.set(element.parentElement, family);
      }

      for (const family of families.values()) {
        family.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
        family.forEach((element, index) => {
          waiting.get(element)?.(index * STAGGER_MS);
          waiting.delete(element);
          observer?.unobserve(element);
        });
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0 },
  );
  return observer;
}

export interface RevealProps {
  /** The element to render. Defaults to a div. */
  as?: 'div' | 'section' | 'article' | 'figure' | 'header' | 'li' | 'p';
  className?: string;
  style?: CSSProperties;
  id?: string;
  children: ReactNode;
}

export function Reveal({ as: Tag = 'div', className, style, id, children }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [delay, setDelay] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      queueMicrotask(() => setDelay(0));
      return;
    }

    waiting.set(element, setDelay);
    sharedObserver().observe(element);
    return () => {
      waiting.delete(element);
      observer?.unobserve(element);
    };
  }, []);

  const revealed = delay !== null;

  return (
    <Tag
      // One ref type for every tag this component can render.
      ref={ref as never}
      id={id}
      className={cx('reveal', revealed && 'is-revealed', className)}
      style={revealed && delay > 0 ? { ...style, transitionDelay: `${delay}ms` } : style}
    >
      {children}
    </Tag>
  );
}
