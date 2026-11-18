import Image from 'next/image';
import { Arrow } from '@/components/site/Arrow';
import { LiveCount } from '@/components/site/LiveCount';
import type { OpenRoom } from '@/lib/site/catalogue';

/**
 * An open room in the catalogue. The left half is the room itself: its own
 * photograph, colours and lettering. The right half is this website saying
 * what it is, in its own voice. Both halves lead to the room's front page.
 */
export function RoomPlate({ room }: { room: OpenRoom }) {
  // "The Ashgrove File": the middle word carries the room's colour, as it
  // does on the room's own cover.
  const words = room.title.split(' ');
  const middle = words.length === 3 ? words[1] : null;
  const titleId = `room-${room.slug}`;

  return (
    <article className="plate" aria-labelledby={titleId}>
      {/* Plain anchors into the room: it has a layout of its own, so this is
          a full page load, and nothing of the room is fetched before it. */}
      <a href={room.href} className="plate__world" aria-hidden="true" tabIndex={-1}>
        <Image
          src={room.image.src}
          width={room.image.width}
          height={room.image.height}
          alt=""
          className="plate__image"
          sizes="(min-width: 60rem) 55vw, 100vw"
          priority
        />
        <span className="plate__tag">File {room.number}</span>
        <span className="plate__title">
          {middle ? (
            <>
              {words[0]} <span>{middle}</span> {words[2]}
            </>
          ) : (
            room.title
          )}
        </span>
      </a>

      <div className="plate__body">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="label">Nº {room.number}</p>
          <p className="status">Open now</p>
        </div>

        <h3 id={titleId} className="display display--3 mt-6">
          {room.title}
        </h3>
        <p className="quiet mt-2">{room.kind}</p>
        <p className="mt-5 text-ink-2">{room.pitch}</p>

        <dl className="facts mt-7">
          {room.facts.map((fact) => (
            <div key={fact.term}>
              <dt className="label">{fact.term}</dt>
              <dd>{fact.detail}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto pt-8">
          <LiveCount />
          <a href={room.href} className="btn mt-4" data-testid={`enter-${room.slug}`}>
            {room.enter}
            <span className="visually-hidden">: {room.title}</span>
            <Arrow />
          </a>
        </div>
      </div>
    </article>
  );
}
