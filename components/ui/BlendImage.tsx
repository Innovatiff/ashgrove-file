import Image from 'next/image';
import type { CSSProperties } from 'react';
import { cx } from '@/lib/format';

/** A small mono label joined to the object by a one-pixel leader line. */
export interface Annotation {
  /** e.g. "EXHIBIT 04 — THE CLOCK, 03:17" */
  label: string;
  /** Where the leader meets the object, as a percentage of the image box. */
  x: number;
  y: number;
  /** Which way the label runs from the foot of the leader. Defaults to right. */
  side?: 'left' | 'right';
  /** How far below the image the label sits, in pixels. Defaults to 28. */
  drop?: number;
  /** Length of the horizontal run before the label, in pixels. Defaults to 40. */
  run?: number;
}

interface Common {
  src: string;
  /** The file's real pixel size. next/image uses it to reserve the space. */
  width: number;
  height: number;
  /** Every exhibit says what it shows. */
  alt: string;
  annotation?: Annotation;
  /** Load eagerly. For the one image at the top of a page. */
  priority?: boolean;
  sizes?: string;
  className?: string;
}

export interface CutoutProps extends Common {
  variant: 'cutout';
}

export interface SceneProps extends Common {
  variant: 'scene';
  /** The elliptical mask: opaque to about 55%, gone by the edge. On by default. */
  ellipse?: boolean;
  /** Straight fades, as a percentage of each side, for sides that meet content. */
  fade?: { top?: number; right?: number; bottom?: number; left?: number };
  /** Crop to this aspect ratio, e.g. "21 / 9". Defaults to the file's own. */
  aspect?: string;
  /** A different crop below 768px, e.g. "4 / 3". */
  aspectNarrow?: string;
  /** object-position for a cropped scene, e.g. "62% 40%". Defaults to the annotated point. */
  focus?: string;
}

export type BlendImageProps = CutoutProps | SceneProps;

/**
 * No image may look like a square photo dropped on the page.
 *
 * cutout  A transparent image placed straight on the page: no wrapper border,
 *         no background, no visible edge. It may overlap frames and line
 *         illustrations so it reads as part of the page.
 * scene   A full photograph that dissolves into the page through a mask.
 *
 * Captions are never strips. Pass `annotation` for a mono label on a leader line.
 */
export function BlendImage(props: BlendImageProps) {
  const { src, width, height, alt, annotation, priority = false, sizes = '100vw', className } = props;
  const drop = annotation?.drop ?? 28;

  const image = (
    <Image src={src} width={width} height={height} alt={alt} sizes={sizes} priority={priority} draggable={false} />
  );

  const left = annotation?.side === 'left';

  // The leader is drawn on the image, so it stays on its object. The label is
  // the figure's caption: it sits at the foot of the leader and wraps inside
  // whatever width is left beside it.
  const leader = annotation ? (
    <span className={cx('annotation', left && 'annotation--left')} aria-hidden="true" />
  ) : null;
  const label = annotation ? (
    <figcaption className={cx('annotation__label mono', left && 'annotation__label--left')}>
      {annotation.label}
    </figcaption>
  ) : null;

  const figureStyle = annotation
    ? ({
        '--at-x': `${annotation.x}%`,
        '--at-y': `${annotation.y}%`,
        '--drop': `${drop}px`,
        '--run': `${annotation.run ?? 40}px`,
        // Room for the label, which hangs below the image and may run to three lines.
        marginBottom: drop + 44,
      } as CSSProperties)
    : undefined;

  if (props.variant === 'cutout') {
    return (
      <figure className={cx('blend blend-cutout', className)} style={figureStyle}>
        <div className="blend__media">
          {image}
          {leader}
        </div>
        {label}
      </figure>
    );
  }

  const { ellipse = true, fade, aspect, aspectNarrow } = props;
  // A cropped scene is cropped about its annotated point, so the leader lands
  // on the same object at every crop.
  const focus = props.focus ?? (annotation ? `${annotation.x}% ${annotation.y}%` : undefined);
  const maskStyle = {
    '--fade-top': `${fade?.top ?? 0}%`,
    '--fade-right': `${fade?.right ?? 0}%`,
    '--fade-bottom': `${fade?.bottom ?? 0}%`,
    '--fade-left': `${fade?.left ?? 0}%`,
    ...(aspect ? { '--aspect': aspect } : {}),
    ...(aspectNarrow ? { '--aspect-narrow': aspectNarrow } : {}),
    ...(focus ? { '--focus': focus } : {}),
  } as CSSProperties;

  return (
    <figure className={cx('blend blend-scene', className)} style={figureStyle}>
      <div className="blend__media">
        <div
          className={cx(
            'blend-scene__image',
            !ellipse && 'blend-scene__image--straight',
            (aspect || aspectNarrow) && 'blend-scene__image--cropped',
          )}
          style={maskStyle}
        >
          {image}
        </div>
        {leader}
      </div>
      {label}
    </figure>
  );
}
