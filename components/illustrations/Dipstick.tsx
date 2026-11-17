import { Illustration } from '@/components/illustrations/Illustration';

const MEASURE = 13;
const START = 54;
const measures = Array.from({ length: 25 }, (_, index) => index);
const at = (measure: number) => START + measure * MEASURE;

/**
 * The dipstick of the seventh lamp, laid against its own scale the way the
 * candle was laid against a rule: twenty-four measures to the brim, and the
 * oil line where the constable read it. The oil line is the one part in orange.
 */
export function Dipstick({ className, title }: { className?: string; title?: string }) {
  const brim = at(24);
  const oil = at(2);

  return (
    <Illustration viewBox="0 0 420 150" className={className} title={title}>
      {/* the stick */}
      <path d={`M${START} 44H${brim}V70H${START}Z`} />
      <circle cx={brim + 16} cy="57" r="7" />
      <path d={`M${brim} 57H${brim + 9}`} />

      {/* what is still wet with oil */}
      <path className="faint" d={`M${START + 5} 44V70M${START + 10} 44V70M${START + 15} 44V70M${START + 20} 44V70`} />
      <path className="ember" d={`M${oil} 36V78`} />

      {/* extension lines down to the scale */}
      <path className="faint dashed" d={`M${START} 76V96M${oil} 82V96M${brim} 76V96`} />

      {/* the scale */}
      <path d={`M${START} 104H${brim}`} />
      {measures.map((measure) => (
        <path
          key={measure}
          className={measure % 6 === 0 ? undefined : 'faint'}
          d={`M${at(measure)} ${measure % 6 === 0 ? 96 : 100}V${measure % 6 === 0 ? 112 : 108}`}
        />
      ))}
      {[0, 6, 12, 18, 24].map((measure) => (
        <text key={measure} x={at(measure)} y="131" fontSize="11" textAnchor="middle">
          {measure}
        </text>
      ))}
      <text x={at(2)} y="28" fontSize="11" textAnchor="middle">
        OIL
      </text>
      <text x={brim} y="28" fontSize="11" textAnchor="end">
        BRIM
      </text>
      <text x={START} y="146" fontSize="11">
        MEASURES
      </text>
    </Illustration>
  );
}
