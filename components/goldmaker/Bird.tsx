import { srcOf, srcSetOf } from '@/lib/goldmaker/pictures';
import { frontPictures } from '@/lib/goldmaker/pictures.generated';

const NAMES: Record<string, string> = { raven: 'A raven', swan: 'A swan', eagle: 'An eagle', phoenix: 'A phoenix' };

/**
 * One of the four birds of the old master's book, as a woodcut. The birds
 * are on the room's front page, so their sizes are in the bundle. They say
 * nothing about what any bird is fed.
 */
export function Bird({ id, size = 76, labelled = false }: { id: string; size?: number; labelled?: boolean }) {
  const picture = frontPictures[id as keyof typeof frontPictures];
  if (!picture || picture.name === 'cellar') return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={srcOf(picture, size * 2)}
      srcSet={srcSetOf(picture)}
      sizes={`${size}px`}
      width={size}
      height={size}
      alt={labelled ? (NAMES[id] ?? id) : ''}
      className="bird"
      style={{ width: size, height: size }}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}
