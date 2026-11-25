import { Arrow } from '@/components/site/Arrow';
import { OPEN_ROOMS } from '@/lib/site/catalogue';

/**
 * One button for each open room, in the catalogue's order, each in the
 * room's own words and under its number, so that two of them side by side
 * cannot be taken for one another.
 *
 * Plain anchors: a room has a layout of its own, so going in is a full page
 * load, and nothing of a room is fetched before it.
 */
export function RoomButtons({ className = 'btn' }: { className?: string }) {
  return (
    <>
      {OPEN_ROOMS.map((room) => (
        <a key={room.slug} href={room.href} className={className} data-testid={`go-${room.slug}`}>
          <span className="btn__n">{room.number}</span>
          {room.enter}
          <span className="visually-hidden">: {room.title}</span>
          <Arrow />
        </a>
      ))}
    </>
  );
}
