import type { ReactNode } from 'react';
import { SealShapes } from '@/components/site/Seal';
import type { CatalogueRoom, OpenRoom } from '@/lib/site/catalogue';

const FIRST = 78;
const STEP = 91;

/**
 * The key rack behind the reception desk: one hook for each room in the
 * catalogue. An open room's key hangs on its hook with a tag, and can be
 * taken: it is a link to that room's front page. A sealed room has no key to
 * give, only wax.
 */
export function KeyRack({ rooms }: { rooms: readonly CatalogueRoom[] }) {
  const width = FIRST * 2 + STEP * (rooms.length - 1);

  return (
    <svg viewBox={`0 0 ${width} 196`} className="dr" focusable="false" role="group" aria-label="The key rack">
      <rect x="6" y="14" width={width - 12} height="118" className="dr-card" />
      <rect x="6" y="132" width={width - 12} height="9" className="dr-card" />
      <rect x={width / 2 - 34} y="3" width="68" height="22" className="dr-brass" />
      <text x={width / 2} y="18.500" textAnchor="middle" fontSize="10.500" className="dr-text" aria-hidden="true">
        KEYS
      </text>

      {rooms.map((room, index) => {
        const x = FIRST + STEP * index;
        const plate = (
          <g aria-hidden="true">
            <rect x={x - 24} y="42" width="48" height="19" className="dr-bone" />
            <text x={x} y="55.500" textAnchor="middle" fontSize="10.500" className="dr-text">
              {room.number}
            </text>
            <circle cx={x} cy="72" r="3.500" className="dr-brass" />
          </g>
        );

        if (room.status === 'sealed') {
          return (
            <g key={room.number} aria-hidden="true">
              {plate}
              <path d={`M${x} 75V92`} className="dr-thin" />
              <g transform={`translate(${x} 108) scale(0.34)`}>
                <SealShapes />
              </g>
            </g>
          );
        }

        return <KeyOnHook key={room.number} room={room} x={x} plate={plate} />;
      })}
    </svg>
  );
}

function KeyOnHook({ room, x, plate }: { room: OpenRoom; x: number; plate: ReactNode }) {
  return (
    <>
      {plate}
      {/* The key is drawn for a hook at x = 78, then moved to its own hook. */}
      <g transform={`translate(${x - FIRST} 0)`}>
        {/* A plain anchor on purpose: this is inside an SVG, and the room has
            its own layout, so going there is a full page load either way. */}
        <a
          href={room.href}
          className="key-link"
          aria-label={`Take key ${room.number}: ${room.title} is open`}
          data-testid={`key-${room.slug}`}
        >
          <rect x="34" y="64" width="130" height="128" fill="transparent" />
          <g className="key-link__key">
            <circle cx="78" cy="92" r="15" className="dr-brass" />
            <circle cx="78" cy="92" r="6.500" className="dr-card" />
            <rect x="74.500" y="106" width="7" height="68" className="dr-brass" />
            <rect x="81.500" y="150" width="13" height="7" className="dr-brass" />
            <rect x="81.500" y="162" width="9" height="7" className="dr-brass" />
            <path d="M91 99Q116 100 121 124" className="dr-thin" />
            <g transform="rotate(9 132 136)">
              <rect x="106" y="124" width="54" height="24" rx="3" className="dr-card" />
              <circle cx="114" cy="136" r="2.500" className="dr-bone" />
              <text x="138" y="140" textAnchor="middle" fontSize="10" className="dr-text" aria-hidden="true">
                OPEN
              </text>
            </g>
          </g>
        </a>
      </g>
    </>
  );
}
