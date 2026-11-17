import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/format';

export interface FrameProps extends HTMLAttributes<HTMLElement> {
  /** The element to render. Defaults to a div. */
  as?: ElementType;
  /** void: page black. panel: one step lighter. clear: the grid shows through. */
  tone?: 'void' | 'panel' | 'clear';
  /** A brighter border, for the block the detective is working in. */
  active?: boolean;
  /** A small mono label set into the top edge, like a tab on a folder. */
  label?: ReactNode;
  /** A second label, set into the top edge on the right. */
  mark?: ReactNode;
  /** Corner tick marks. On unless the frame shares edges with its neighbours. */
  ticks?: boolean;
  children?: ReactNode;
}

/**
 * The one-pixel frame every content block sits in, with a small tick mark
 * overshooting each corner.
 */
export function Frame({
  as: Tag = 'div',
  tone = 'void',
  active = false,
  label,
  mark,
  ticks = true,
  className,
  children,
  ...rest
}: FrameProps) {
  return (
    <Tag className={cx('frame', tone !== 'void' && `frame--${tone}`, active && 'frame--active', className)} {...rest}>
      {ticks && (
        <>
          <span className="frame__tick frame__tick--tl" aria-hidden="true" />
          <span className="frame__tick frame__tick--tr" aria-hidden="true" />
          <span className="frame__tick frame__tick--bl" aria-hidden="true" />
          <span className="frame__tick frame__tick--br" aria-hidden="true" />
        </>
      )}
      {label ? <span className="frame__label mono">{label}</span> : null}
      {mark ? <span className="frame__label frame__label--right mono">{mark}</span> : null}
      {children}
    </Tag>
  );
}
