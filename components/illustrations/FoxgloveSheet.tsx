import { Illustration } from '@/components/illustrations/Illustration';

const STEM_X = 150;
const FIRST_Y = 432;
const STEP = 18;

/** Eleven lower leaves were counted on the stem. These three are still on it. */
const KEPT = new Set([1, 2, 4]);
const POSITIONS = Array.from({ length: 11 }, (_, index) => index + 1);

/** A lance-shaped leaf on a short stalk, with its midrib. */
function leaf(x: number, y: number, side: 1 | -1, length: number, rise: number): string {
  const sx = x + side * 12;
  const sy = y - 4;
  const tx = sx + side * length;
  const ty = sy - rise;
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const nx = -(ty - sy) * 0.3;
  const ny = (tx - sx) * 0.3;
  const point = (px: number, py: number) => `${px.toFixed(1)} ${py.toFixed(1)}`;
  return [
    `M${point(x, y)}L${point(sx, sy)}`,
    `Q${point(mx + nx, my + ny)} ${point(tx, ty)}`,
    `Q${point(mx - nx, my - ny)} ${point(sx, sy)}`,
    `L${point(tx, ty)}`,
  ].join('');
}

/**
 * Sheet 14 as the constable drew it: the stem, the bells, the three lower
 * leaves that are left, and a short stalk wherever a leaf was cut away. The
 * cuts are the one part in orange.
 */
export function FoxgloveSheet({ className, title }: { className?: string; title?: string }) {
  const bells = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <Illustration viewBox="0 0 300 480" className={className} title={title}>
      {/* the sheet, and where the margin notes run */}
      <path className="faint" d="M22 10H278V470H22Z" />
      <path className="faint dashed" d="M206 52H262M206 66H250M206 80H258M206 300H262M206 314H246M206 328H256" />

      {/* the stem */}
      <path d="M150 462C150 330 150 250 152 214C154 150 158 96 166 36" />

      {/* strips of tape */}
      <path className="faint" d="M136 450H164V458H136ZM138 232H166V240H138ZM146 120H174V128H146Z" />

      {/* the bells, largest lowest, hanging to one side of the stem */}
      {bells.map((index) => {
        const y = 214 - index * 22;
        const x = 152.4 + index * 1.7;
        const size = 1 - index * 0.075;
        return (
          <g key={index} transform={`translate(${x.toFixed(1)} ${y}) rotate(-38) scale(${size.toFixed(2)})`}>
            <path d="M0 0V5" />
            <path d="M0 5C-4 12 -7 22 -9 32Q0 37 9 32C7 22 4 12 0 5Z" />
            <path d="M-9 32Q0 27 9 32" />
          </g>
        );
      })}
      <path d="M166 36L170 26M166 36L162 27" />

      {/* eleven places a lower leaf grew: a leaf, or the stalk it was cut from */}
      {POSITIONS.map((position) => {
        const y = FIRST_Y - (position - 1) * STEP;
        const side = position % 2 === 1 ? -1 : 1;
        if (KEPT.has(position)) {
          const length = position === 4 ? 62 : 84;
          const rise = position === 4 ? 34 : position === 1 ? 46 : 18;
          return <path key={position} d={leaf(STEM_X, y, side, length, rise)} />;
        }
        const ex = STEM_X + side * 13;
        return (
          <g key={position}>
            <path d={`M${STEM_X} ${y}L${ex} ${y - 4}`} />
            <path className="ember" d={`M${ex - side * 3} ${y - 10}L${ex + side * 3} ${y + 2}`} />
          </g>
        );
      })}

      {/* legend */}
      <path d="M40 444L52 440" />
      <path className="ember" d="M49 434L55 446" />
      <text x="62" y="445" fontSize="9">
        CUT
      </text>
    </Illustration>
  );
}
