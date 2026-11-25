import { type Sized, srcOf, srcSetOf } from '@/lib/goldmaker/pictures';

export interface PhotoProps {
  picture: Sized & { alt: string };
  /** How wide it is shown, as a `sizes` attribute. */
  sizes: string;
  className?: string;
  /** The first thing on the page: fetched at once. Everything else waits until it is near. */
  priority?: boolean;
  /** Overrides the picture's own description. "" marks it as decoration. */
  alt?: string;
}

/**
 * One of the room's photographs. The site is a static export with no image
 * server, so this is a plain <img> that offers the browser every width on
 * disk and lets it choose.
 */
export function Photo({ picture, sizes, className, priority = false, alt }: PhotoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={srcOf(picture)}
      srcSet={srcSetOf(picture)}
      sizes={sizes}
      width={picture.width}
      height={picture.height}
      alt={alt ?? picture.alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      draggable={false}
    />
  );
}
