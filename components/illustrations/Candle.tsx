import { Illustration } from '@/components/illustrations/Illustration';

const INCH = 50;
const START = 70;
const inches = [0, 1, 2, 3, 4, 5, 6];

/**
 * The candle as the constable found it: laid against a rule, five inches of
 * wax left of the six it was sold with.
 */
export function Candle({ className, title }: { className?: string; title?: string }) {
  const burnt = START + 5 * INCH;
  const full = START + 6 * INCH;

  return (
    <Illustration viewBox="0 0 420 150" className={className} title={title}>
      {/* what has burned away */}
      <path className="faint dashed" d={`M${burnt} 44H${full}V74H${burnt}`} />

      {/* the candle */}
      <path d={`M${START} 44H${burnt}M${START} 74H${burnt}`} />
      <ellipse cx={START} cy="59" rx="4" ry="15" />
      <ellipse cx={burnt} cy="59" rx="4" ry="15" />
      <path d={`M${burnt + 4} 59H${burnt + 16}`} />
      <path className="faint" d="M176 44C176 37 186 37 186 44M250 74C250 83 259 83 259 74" />

      {/* extension lines down to the rule */}
      <path className="faint dashed" d={`M${START} 80V96M${burnt} 80V96M${full} 80V96`} />

      {/* the rule */}
      <path d={`M${START} 104H${full}`} />
      {inches.map((inch) => (
        <path key={inch} d={`M${START + inch * INCH} 96V112`} />
      ))}
      {inches.slice(0, -1).map((inch) => (
        <path key={inch} className="faint" d={`M${START + inch * INCH + INCH / 2} 100V108`} />
      ))}
      {inches.map((inch) => (
        <text key={inch} x={START + inch * INCH} y="130" fontSize="9" textAnchor="middle">
          {inch}
        </text>
      ))}
      <text x={full + 16} y="130" fontSize="9">
        IN.
      </text>
    </Illustration>
  );
}
