import { type VenuePhotoName, venuePhotos } from '@/lib/site/venue.generated';

export interface PhotoProps {
  /** Which photograph. The files and their sizes come from scripts/process-venue.mjs. */
  name: VenuePhotoName;
  /** What the photograph shows, for someone who cannot see it. */
  alt: string;
  /** How wide it is shown, in the form the `sizes` attribute takes. */
  sizes: string;
  /** True for the one picture at the top of the page: it is loaded at once. */
  priority?: boolean;
  className?: string;
}

/** The picture's sources, in the form the `srcset` attribute takes. */
export function srcSetOf(name: VenuePhotoName): string {
  return venuePhotos[name].sources.map((source) => `${source.src} ${source.width}w`).join(', ');
}

/** The widest file: what a browser that does not read `srcset` is given. */
export function largestOf(name: VenuePhotoName): string {
  const { sources } = venuePhotos[name];
  return sources[sources.length - 1]?.src ?? '';
}

/**
 * A photograph of the venue. The site is a static export with no image
 * server, so each picture is made at several widths when it is processed and
 * the browser picks the one that fits. Width and height are always given, so
 * the page does not jump when it arrives.
 */
export function Photo({ name, alt, sizes, priority = false, className }: PhotoProps) {
  const photo = venuePhotos[name];
  return (
    // A plain <img> on purpose: next/image has nothing to add without a server
    // to resize for it, and the widths here are made ahead of time.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={largestOf(name)}
      srcSet={srcSetOf(name)}
      sizes={sizes}
      width={photo.width}
      height={photo.height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={className}
    />
  );
}
