import { SealShapes } from '@/components/site/Seal';
import { ASHGROVE } from '@/lib/site/catalogue';

/**
 * The corridor: five doors on a tiled floor, a lamp between each pair, and no
 * two doors the same shape.
 *
 * The first stands ajar. What is inside it is dark, with one small flame, and
 * its light lies on the floor in the only colour on the page that is not this
 * website's own: that room's orange. The rest are shut, with a wax seal over
 * each lock.
 *
 * The open door is a real link to the room's front page. Everything else in
 * the drawing is decoration, and is described once, in the caption.
 */

function NumberPlate({ x, y, number }: { x: number; y: number; number: string }) {
  return (
    <g>
      <rect x={x - 33} y={y} width="66" height="29" className="corridor__plate" />
      <text x={x} y={y + 20.5} textAnchor="middle" className="corridor__number">
        {number}
      </text>
    </g>
  );
}

function Seal({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <SealShapes />
    </g>
  );
}

export function Corridor() {
  return (
    <figure className="corridor">
      <svg viewBox="0 0 1240 420" preserveAspectRatio="xMinYMax slice" focusable="false">
        <defs>
          <pattern id="corridor-tiles" width="60" height="60" patternUnits="userSpaceOnUse" y="360">
            <rect width="30" height="30" className="dr-tile" />
            <rect x="30" y="30" width="30" height="30" className="dr-tile" />
          </pattern>
        </defs>
        {/* the floor, under everything */}
        <rect x="0" y="360" width="1240" height="60" fill="url(#corridor-tiles)" aria-hidden="true" />
        {/* ------------------------------------------------ 001, standing open */}
        {/* A plain anchor on purpose: this is inside an SVG, and the room has
            its own layout, so going there is a full page load either way. */}
        <a href={ASHGROVE.href} className="corridor__open" aria-label={`File ${ASHGROVE.number}, ${ASHGROVE.title}. The door is open.`}>
          <polygon points="150,360 230,360 300,420 112,420" fill="var(--ember)" className="corridor__light" />
          <rect x="70" y="80" width="160" height="280" fill="var(--night)" />
          <path d="M190 228C179.200 215.400 185.500 204.600 190 193.800C194.500 204.600 200.800 215.400 190 228Z" fill="var(--ember)" />
          <polygon points="70,80 150,98 150,346 70,360" className="corridor__leaf" />
          <polygon points="84,102.400 136,112.600 136,209 84,206.600" className="corridor__thin" />
          <polygon points="84,223.100 136,224.200 136,330.700 84,338.300" className="corridor__thin" />
          <circle cx="141.500" cy="232" r="3.500" fill="var(--ink)" />
          <rect x="70" y="80" width="160" height="280" className="corridor__line" />
          <NumberPlate x={150} y={34} number="001" />
        </a>

        <g aria-hidden="true">
          {/* --------------------------------------- a lamp between each pair */}
          {[270, 488, 770, 1058].map((x) => (
            <g key={x}>
              <rect x={x - 3} y="150" width="6" height="18" className="dr-brass" />
              <path d={`M${x - 14} 150 ${x - 9} 126H${x + 9}L${x + 14} 150Z`} className="dr-card" />
              <path d={`M${x - 8} 168H${x + 8}`} className="dr-line" />
            </g>
          ))}

          {/* ------------------------------------------ 002, arched and planked */}
          <path d="M310 360V170A70 70 0 0 1 450 170V360Z" className="corridor__leaf" />
          <path d="M322 360V170A58 58 0 0 1 438 170V360" className="corridor__thin" />
          <path d="M351 119.800V360M380 112V360M409 119.800V360" className="corridor__thin" />
          <path d="M322 204H364M322 314H364" className="corridor__line" />
          <circle cx="364" cy="204" r="3" fill="var(--ink)" />
          <circle cx="364" cy="314" r="3" fill="var(--ink)" />
          <Seal x={417} y={258} size={0.38} />
          <NumberPlate x={380} y={54} number="002" />

          {/* ----------------------------------------------- 003, a round hatch */}
          <circle cx="632" cy="255" r="105" className="corridor__leaf" />
          <circle cx="632" cy="255" r="88" className="corridor__thin" />
          {Array.from({ length: 12 }, (_, index) => {
            const angle = (index * Math.PI) / 6 + Math.PI / 12;
            return (
              <circle
                key={index}
                cx={(632 + 96.5 * Math.cos(angle)).toFixed(1)}
                cy={(255 + 96.5 * Math.sin(angle)).toFixed(1)}
                r="2.500"
                fill="var(--ink)"
              />
            );
          })}
          <circle cx="632" cy="255" r="48" className="corridor__thin" />
          <path d="M598 221 666 289M666 221 598 289" className="corridor__thin" />
          <rect x="514" y="225" width="22" height="60" className="corridor__leaf" />
          <Seal x={632} y={255} size={0.44} />
          <NumberPlate x={632} y={104} number="003" />

          {/* ------------------------------------ 004, a pair under a pediment */}
          <path d="M803 110 915 60 1027 110Z" className="corridor__leaf" />
          <rect x="815" y="110" width="200" height="250" className="corridor__leaf" />
          <path d="M915 110V360" className="corridor__line" />
          <rect x="831" y="128" width="68" height="88" className="corridor__thin" />
          <rect x="831" y="234" width="68" height="108" className="corridor__thin" />
          <rect x="931" y="128" width="68" height="88" className="corridor__thin" />
          <rect x="931" y="234" width="68" height="108" className="corridor__thin" />
          <Seal x={915} y={226} size={0.4} />
          <NumberPlate x={915} y={16} number="004" />

          {/* ------------------------------------------------ 005, a small one */}
          <path d="M1090 360V292A40 40 0 0 1 1170 292V360Z" className="corridor__leaf" />
          <path d="M1100 360V292A30 30 0 0 1 1160 292V360" className="corridor__thin" />
          <Seal x={1146} y={316} size={0.25} />
          <NumberPlate x={1130} y={206} number="005" />

          {/* and so on */}
          <circle cx="1202" cy="332" r="2.500" fill="var(--ink)" />
          <circle cx="1216" cy="332" r="2.500" fill="var(--ink)" />
          <circle cx="1230" cy="332" r="2.500" fill="var(--ink)" />

          <path d="M0 360H1240" className="corridor__line" />
        </g>
      </svg>
      <figcaption className="visually-hidden">
        A corridor of five doors, no two the same shape. The first stands open, with orange light on the floor in front
        of it. The other four are shut, each with a red wax seal over the lock.
      </figcaption>
    </figure>
  );
}
