import type { ReactNode } from 'react';
import { cx } from '@/lib/format';

export interface SectionProps {
  id?: string;
  /** id of the heading that names this section. */
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}

/**
 * A band of the page, held to the measure, with a faint registration
 * crosshair at each corner.
 */
export function Section({ id, labelledBy, className, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className="measure">
      <div className={cx('section', className)}>
        <span className="reg reg--tl" aria-hidden="true" />
        <span className="reg reg--tr" aria-hidden="true" />
        <span className="reg reg--bl" aria-hidden="true" />
        <span className="reg reg--br" aria-hidden="true" />
        {children}
      </div>
    </section>
  );
}
