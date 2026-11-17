'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { cx } from '@/lib/format';

/**
 * THE ONLY MOTION, part two.
 *
 * Every line illustration is an inline SVG: one-pixel strokes in
 * var(--line-strong), no fill, drawn like an engraving or a technical plate.
 * On entering view the strokes draw themselves once, over 1200ms, by
 * animating stroke-dashoffset. Under prefers-reduced-motion the drawing is
 * simply there.
 *
 * At most one part of an illustration may be orange: give it className="ember".
 * className="faint" is for construction lines, className="dashed" for dashed
 * ones (those appear whole: a dashed line cannot be drawn by its dash).
 */

const DRAW_MS = 1200;
const EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
const SHAPES = 'path, line, circle, ellipse, rect, polyline, polygon';

export interface IllustrationProps {
  viewBox: string;
  /** What the drawing shows. Leave out for a purely decorative figure. */
  title?: string;
  className?: string;
  children: ReactNode;
}

export function Illustration({ viewBox, title, className, children }: IllustrationProps) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    // The state lives in a data attribute React does not manage, so a
    // re-render can never un-draw a finished illustration.
    const finish = () => svg.setAttribute('data-drawn', '');

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || typeof IntersectionObserver === 'undefined') {
      finish();
      return;
    }

    let timer: number | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        const box = svg.getBoundingClientRect();
        const unit = svg.viewBox.baseVal.width > 0 ? box.width / svg.viewBox.baseVal.width : 1;
        const strokes = [...svg.querySelectorAll<SVGGeometryElement>(SHAPES)].filter(
          (shape) => !shape.classList.contains('dashed'),
        );

        // Strokes keep their one-pixel width at any size (non-scaling-stroke),
        // which makes some engines measure dashes in screen pixels and others
        // in drawing units. Covering the longer of the two is right in both.
        for (const stroke of strokes) {
          const length = stroke.getTotalLength();
          const dash = Math.ceil(Math.max(length, length * unit)) + 4;
          stroke.style.strokeDasharray = String(dash);
          stroke.style.strokeDashoffset = String(dash);
        }

        finish();
        svg.getBoundingClientRect(); // commit the hidden state before animating

        for (const stroke of strokes) {
          stroke.style.transition = `stroke-dashoffset ${DRAW_MS}ms ${EASE}`;
          stroke.style.strokeDashoffset = '0';
        }

        timer = window.setTimeout(() => {
          for (const stroke of strokes) {
            stroke.style.transition = '';
            stroke.style.strokeDasharray = '';
            stroke.style.strokeDashoffset = '';
          }
        }, DRAW_MS + 120);
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    );
    observer.observe(svg);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      className={cx('illustration', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {children}
    </svg>
  );
}
