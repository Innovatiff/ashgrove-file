import { Illustration } from '@/components/illustrations/Illustration';

const X = 150;
const GAP = 34;
/** The tower door, at the top of the plan. */
const DOOR_Y = 46;
/** The marsh gate, where the boards end at the thirteenth post. */
const GATE_Y = DOOR_Y + 4 * GAP;

const POSTS = Array.from({ length: 13 }, (_, index) => 13 - index);
const postY = (post: number) => GATE_Y + (13 - post) * GAP;

/**
 * A plan of the boards, drawn to scale and stood on end so it stays readable
 * on a narrow screen: the Hall at the top, the church at the foot, thirteen
 * posts eighty yards apart, and the park path from the marsh gate to the
 * tower door. The seventh post, with its empty hook, is the one part in orange.
 */
export function Boardwalk({ className, title }: { className?: string; title?: string }) {
  return (
    <Illustration viewBox="0 0 360 648" className={className} title={title}>
      {/* the tower */}
      <path d={`M${X - 13} ${DOOR_Y}V14H${X + 13}V${DOOR_Y}Z`} />
      <path d={`M${X - 13} 14L${X} 2L${X + 13} 14`} />
      <rect x={X - 4} y="22" width="8" height="10" />
      <text x={X + 26} y="24" fontSize="10">
        THE TOWER
      </text>
      <text x={X + 26} y={DOOR_Y + 2} fontSize="10">
        TOWER DOOR
      </text>

      {/* the park path: 320 yards */}
      <path className="dashed" d={`M${X} ${DOOR_Y}V${GATE_Y}`} />
      <path className="faint" d={`M${X - 44} ${DOOR_Y}V${GATE_Y}M${X - 49} ${DOOR_Y}H${X - 39}M${X - 49} ${GATE_Y}H${X - 39}`} />
      <text x={X - 54} y={(DOOR_Y + GATE_Y) / 2 + 3} fontSize="10" textAnchor="end">
        320 YD
      </text>
      <text x={X + 26} y={(DOOR_Y + GATE_Y) / 2 + 3} fontSize="10">
        PARK PATH
      </text>

      {/* the boards */}
      <path d={`M${X} ${GATE_Y}V${postY(1)}`} />
      <path d={`M${X - 18} ${GATE_Y}H${X + 18}`} />
      <text x={X + 26} y={GATE_Y + 3} fontSize="10">
        MARSH GATE. LODGE
      </text>

      {POSTS.map((post) => {
        const y = postY(post);
        const seventh = post === 7;
        return (
          <g key={post}>
            <circle className={seventh ? 'ember' : undefined} cx={X} cy={y} r={seventh ? 5 : 3.5} />
            <text x={X - 14} y={y + 3.5} fontSize="10" textAnchor="end">
              {post}
            </text>
          </g>
        );
      })}

      {/* eighty yards from post to post */}
      <path
        className="faint"
        d={`M${X - 44} ${postY(13)}V${postY(12)}M${X - 49} ${postY(13)}H${X - 39}M${X - 49} ${postY(12)}H${X - 39}`}
      />
      <text x={X - 54} y={(postY(13) + postY(12)) / 2 + 3} fontSize="10" textAnchor="end">
        80 YD
      </text>

      {/* the staithe, at the tenth post */}
      <path d={`M${X + 6} ${postY(10)}H${X + 20}`} />
      <text x={X + 26} y={postY(10) + 3} fontSize="10">
        THE STAITHE
      </text>

      {/* the spur to Marsh Row, at the seventh post */}
      <path d={`M${X + 8} ${postY(7)}H${X + 62}`} />
      <path d={`M${X + 62} ${postY(7) - 7}H${X + 98}V${postY(7) + 7}H${X + 62}ZM${X + 74} ${postY(7) - 7}V${postY(7) + 7}M${X + 86} ${postY(7) - 7}V${postY(7) + 7}`} />
      <text x={X + 62} y={postY(7) + 24} fontSize="10">
        MARSH ROW
      </text>
      <text x={X + 62} y={postY(7) - 14} fontSize="10">
        HOOK EMPTY
      </text>

      {/* the church, with its stopped clock */}
      <path d={`M${X} ${postY(1)}V${postY(1) + 14}`} />
      <path d={`M${X - 16} ${postY(1) + 40}V${postY(1) + 14}H${X + 16}V${postY(1) + 40}Z`} />
      <circle cx={X} cy={postY(1) + 27} r="6" />
      <path d={`M${X} ${postY(1) + 27}L${X + 4.5} ${postY(1) + 27.5}M${X} ${postY(1) + 27}L${X + 3} ${postY(1) + 28.6}`} />
      <text x={X + 26} y={postY(1) + 3} fontSize="10">
        NO. 1
      </text>
      <text x={X + 26} y={postY(1) + 30} fontSize="10">
        CHURCH. VICARAGE
      </text>
    </Illustration>
  );
}
