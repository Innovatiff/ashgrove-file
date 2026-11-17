import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import { cx } from '@/lib/format';

export interface PinnedPhotoProps {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Set under the photograph in mono, e.g. "SUSPECT 02 — THE DOCTOR". */
  caption: ReactNode;
  /** Rotation in degrees, held between -1.5 and 1.5. Derived from the file name if left out. */
  tilt?: number;
  sizes?: string;
  className?: string;
}

/** A steady tilt for a given photograph: the same on the server and in the browser. */
function tiltFor(src: string): number {
  let hash = 0;
  for (const character of src) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  const unit = (((hash % 301) + 301) % 301) / 300;
  return Math.round((unit * 3 - 1.5) * 100) / 100;
}

/**
 * Portraits only. The one image allowed a hard rectangle, because it reads
 * as a photograph pinned to the evidence wall: a one-pixel frame, turned a
 * degree or so, a short grey pin line from the top edge, a mono caption.
 */
export function PinnedPhoto({ src, width, height, alt, caption, tilt, sizes = '(min-width: 768px) 280px, 60vw', className }: PinnedPhotoProps) {
  const degrees = Math.max(-1.5, Math.min(1.5, tilt ?? tiltFor(src)));

  return (
    <figure className={cx('pinned', className)} style={{ '--tilt': `${degrees}deg` } as CSSProperties}>
      <span className="pinned__pin" aria-hidden="true" />
      <div className="pinned__frame">
        <Image src={src} width={width} height={height} alt={alt} sizes={sizes} draggable={false} />
      </div>
      <figcaption className="pinned__caption mono">{caption}</figcaption>
    </figure>
  );
}
