import { Illustration } from '@/components/illustrations/Illustration';

const CENTRE = 200;

/** A point on the dial: angle in degrees clockwise from twelve. */
function at(angle: number, radius: number): [number, number] {
  const radians = (angle * Math.PI) / 180;
  return [
    Math.round((CENTRE + radius * Math.sin(radians)) * 100) / 100,
    Math.round((CENTRE - radius * Math.cos(radians)) * 100) / 100,
  ];
}

// 03:17. The hour hand has moved 17/60 of the way from the three to the four.
const HOUR_ANGLE = (3 + 17 / 60) * 30; // 98.5 degrees
const MINUTE_ANGLE = 17 * 6; // 102 degrees

const ticks = Array.from({ length: 60 }, (_, minute) => {
  const inner = minute % 15 === 0 ? 130 : minute % 5 === 0 ? 140 : 152;
  const [x1, y1] = at(minute * 6, inner);
  const [x2, y2] = at(minute * 6, 162);
  return { minute, x1, y1, x2, y2 };
});

function hourHand(): string {
  // A narrow spade: shoulders either side of the arbor, widest two thirds out.
  const side = (angle: number, along: number, across: number): string => {
    const [x, y] = at(angle, along);
    const radians = ((angle + 90) * Math.PI) / 180;
    return `${(x + across * Math.sin(radians)).toFixed(2)},${(y - across * Math.cos(radians)).toFixed(2)}`;
  };
  return [
    side(HOUR_ANGLE, 0, 3),
    side(HOUR_ANGLE, 62, 6),
    at(HOUR_ANGLE, 94).join(','),
    side(HOUR_ANGLE, 62, -6),
    side(HOUR_ANGLE, 0, -3),
  ].join(' ');
}

/** The mantel clock face, stopped at 03:17. The hands are the one part in orange. */
export function Clock0317({ className, title }: { className?: string; title?: string }) {
  const [minuteX, minuteY] = at(MINUTE_ANGLE, 144);
  const [tailX, tailY] = at(MINUTE_ANGLE + 180, 26);
  const [arcX, arcY] = at(MINUTE_ANGLE, 112);

  return (
    <Illustration viewBox="0 0 400 400" className={className} title={title}>
      {/* centre lines */}
      <path className="faint dashed" d="M0 200H400M200 0V400" />

      {/* bezel and dial */}
      <circle cx="200" cy="200" r="190" />
      <circle cx="200" cy="200" r="180" />
      <circle className="faint" cx="200" cy="200" r="162" />
      <circle className="faint" cx="200" cy="200" r="152" />

      {/* minute track */}
      {ticks.map((tick) => (
        <line
          key={tick.minute}
          className={tick.minute % 5 === 0 ? undefined : 'faint'}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
        />
      ))}

      {/* twelve */}
      <path d="M200 26L206 38H194Z" />

      {/* winding arbors */}
      <circle cx="160" cy="262" r="6" />
      <circle cx="240" cy="262" r="6" />

      {/* the angle the minute hand has travelled */}
      <path className="faint" d={`M200 88A112 112 0 0 1 ${arcX} ${arcY}`} />

      {/* the hands, stopped */}
      <g className="ember">
        <polygon className="ember" points={hourHand()} />
        <line className="ember" x1={tailX} y1={tailY} x2={minuteX} y2={minuteY} />
      </g>

      {/* arbor */}
      <circle cx="200" cy="200" r="7" />
      <circle cx="200" cy="200" r="2" />
    </Illustration>
  );
}
