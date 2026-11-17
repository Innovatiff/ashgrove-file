import type { ReactNode } from 'react';
import { cx } from '@/lib/format';

export interface DoubleRuleProps {
  title: ReactNode;
  /** A short mono index set before the title, e.g. "01". */
  index?: string;
  /** A mono note set at the far end of the rule. Hidden on narrow screens. */
  note?: ReactNode;
  /** Heading level. Defaults to h2. */
  as?: 'h1' | 'h2' | 'h3';
  /** id for the heading, so a section can be labelled by it. */
  id?: string;
  className?: string;
}

/** A section title sitting on a double rule: two one-pixel lines, three pixels apart. */
export function DoubleRule({ title, index, note, as: Heading = 'h2', id, className }: DoubleRuleProps) {
  return (
    <header className={cx('double-rule', className)}>
      <div className="flex items-end justify-between gap-6 pb-3">
        <div className="flex min-w-0 items-baseline gap-4">
          {index ? (
            <span className="mono muted" aria-hidden="true">
              {index}
            </span>
          ) : null}
          <Heading id={id} className="title title--section">
            {title}
          </Heading>
        </div>
        {note ? <span className="mono muted hidden text-right sm:block">{note}</span> : null}
      </div>
      <div className="double-rule__lines" aria-hidden="true" />
    </header>
  );
}
