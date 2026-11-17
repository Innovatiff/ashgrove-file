import { Illustration } from '@/components/illustrations/Illustration';

/** A sash window: frame, centre mullion, one transom. */
function Sash({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} />
      <path className="faint" d={`M${x + w / 2} ${y}V${y + h}M${x} ${y + h * 0.45}H${x + w}`} />
    </>
  );
}

const UPPER = [322, 374, 426, 484, 536, 588];
const LOWER = [322, 374, 536, 588];

/**
 * The Hall in front elevation: a Victorian manor with one narrow tower.
 * The window at the top of the tower is the one part in orange.
 */
export function HallElevation({ className, title }: { className?: string; title?: string }) {
  return (
    <Illustration viewBox="0 0 960 400" className={className} title={title}>
      {/* datum, overall width, tower height */}
      <path d="M0 360H960" />
      <path className="faint" d="M180 384H868M180 378V390M868 378V390M650 380V388M720 380V388" />
      <path className="faint" d="M908 2V360M902 2H914M902 360H914" />
      <path className="faint dashed" d="M685 0V400" />

      {/* west wing: gable, bay, attic light */}
      <path d="M180 360V220L240 140L300 220" />
      <path d="M240 140V122" />
      <rect x="206" y="290" width="68" height="70" />
      <path className="faint" d="M229 290V360M251 290V360M206 322H274" />
      <Sash x={222} y={226} w={36} h={46} />
      <rect x="234" y="170" width="12" height="24" />
      <path d="M270 180V150H286V202" />
      <path d="M266 150H290" />

      {/* main range */}
      <path d="M300 360V200H640V360" />
      <path d="M290 200L320 150H620L650 200Z" />
      <path className="faint" d="M312.8 162H627.2M305.6 174H634.4M298.4 186H641.6" />
      {UPPER.map((x) => (
        <Sash key={x} x={x} y={218} w={30} h={46} />
      ))}
      {LOWER.map((x) => (
        <Sash key={x} x={x} y={290} w={30} h={54} />
      ))}
      <path className="faint" d="M300 278H640" />

      {/* door and step */}
      <path d="M452 360V306A18 18 0 0 1 488 306V360" />
      <path className="faint" d="M470 288V360" />
      <path d="M440 360V354H500V360" />

      {/* chimney stacks */}
      <path d="M350 150V116H372V150M346 116H376" />
      <path d="M560 150V116H582V150M556 116H586" />
      <path className="faint" d="M357 116V106M365 116V106M567 116V106M575 116V106" />

      {/* the tower */}
      <path d="M650 360V70H720V360" />
      <path d="M644 70H726V60H644Z" />
      <path d="M644 60L685 14L726 60" />
      <path d="M685 14V2" />
      <path className="faint" d="M650 140H720M650 232H720" />
      <rect x="678" y="160" width="14" height="42" />
      <rect x="678" y="252" width="14" height="42" />

      {/* east wing */}
      <path d="M720 250H860V360" />
      <path d="M720 250L736 214H844L868 250" />
      <path className="faint" d="M728 232H856" />
      <Sash x={744} y={280} w={28} h={46} />
      <Sash x={808} y={280} w={28} h={46} />

      {/* the one lit window */}
      <g className="ember">
        <rect className="ember" x="674" y="84" width="22" height="34" />
        <path className="ember" d="M685 84V118M674 99H696" />
      </g>
    </Illustration>
  );
}
