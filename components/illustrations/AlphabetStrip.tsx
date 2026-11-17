import { Illustration } from '@/components/illustrations/Illustration';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const CELL = 30;
const LEFT = 15;
const ROWS = [
  { top: 12, letters: LETTERS.slice(0, 13) },
  { top: 58, letters: LETTERS.slice(13) },
];

/**
 * The alphabet on a ruled strip, for counting back along. Two rows, so the
 * letters stay readable on a narrow screen. The arrow is the one part in
 * orange: a cipher letter is always set back, never forward.
 */
export function AlphabetStrip({ className, title }: { className?: string; title?: string }) {
  return (
    <Illustration viewBox="0 0 420 132" className={className} title={title}>
      {ROWS.map((row) => (
        <g key={row.top}>
          <path d={`M${LEFT} ${row.top}H${LEFT + 13 * CELL}V${row.top + 30}H${LEFT}Z`} />
          {row.letters.slice(1).map((letter, index) => (
            <path key={letter} className="faint" d={`M${LEFT + (index + 1) * CELL} ${row.top}V${row.top + 30}`} />
          ))}
          {row.letters.map((letter, index) => (
            <text key={letter} x={LEFT + index * CELL + CELL / 2} y={row.top + 20} fontSize="13" textAnchor="middle" letterSpacing="0">
              {letter}
            </text>
          ))}
        </g>
      ))}

      {/* M runs on into N */}
      <path className="faint dashed" d={`M${LEFT + 13 * CELL} 27H412V73H${LEFT + 13 * CELL}`} />

      {/* set back, never forward */}
      <path className="ember" d="M120 112H15M15 112L24 106M15 112L24 118" />
      <text x="132" y="116" fontSize="11">
        SET BACK. BEFORE A COMES Z.
      </text>
    </Illustration>
  );
}
