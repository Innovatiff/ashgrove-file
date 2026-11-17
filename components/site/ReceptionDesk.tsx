/**
 * The reception desk, across the whole width of the page: a panelled wall
 * with coat hooks and a framed request, an umbrella stand and a fern, the desk
 * with its bell, ledger, lamp and the practice box, and the rope across the
 * way to the rooms.
 *
 * It is furniture: decoration only, hidden from screen readers. What the
 * things on the desk say is written out as text in the section below it.
 */
export function ReceptionDesk() {
  const panels = Array.from({ length: 10 }, (_, index) => 12 + index * 124);

  return (
    <div className="desk" aria-hidden="true">
      <svg viewBox="0 0 1240 300" preserveAspectRatio="xMidYMax slice" focusable="false">
        <defs>
          <pattern id="lobby-tiles" width="50" height="50" patternUnits="userSpaceOnUse" y="250">
            <rect width="25" height="25" className="dr-tile" />
            <rect x="25" y="25" width="25" height="25" className="dr-tile" />
          </pattern>
        </defs>

        {/* the wall: a rail, and panels under it */}
        <path d="M0 36H1240M0 42H1240" className="dr-faint" />
        {panels.map((x) => (
          <rect key={x} x={x} y="58" width="100" height="176" className="dr-faint" />
        ))}

        {/* the floor */}
        <rect x="0" y="250" width="1240" height="50" fill="url(#lobby-tiles)" />

        {/* coat hooks: a hat on one, a coat on the next */}
        <rect x="20" y="78" width="112" height="6" className="dr-card" />
        {[40, 76, 112].map((x) => (
          <circle key={x} cx={x} cy="81" r="3.200" className="dr-brass" />
        ))}
        <path d="M26 102Q40 76 54 102Z" className="dr-night" />
        <path d="M20 102H60" className="dr-line" />
        <path d="M68 86Q76 80 84 86L90 152H62Z" className="dr-card" />
        <path d="M76 84V152M70 100H74M70 112H74" className="dr-thin" />

        {/* a framed request */}
        <rect x="686" y="50" width="122" height="38" className="dr-card" />
        <rect x="691" y="55" width="112" height="28" className="dr-thin" />
        <text x="747" y="73" textAnchor="middle" fontSize="9.500" className="dr-text">
          NO SPOILERS
        </text>

        {/* an umbrella stand */}
        <path d="M164 190V142A6 6 0 0 1 176 142M180 190V128A6 6 0 0 0 168 128" className="dr-line" />
        <rect x="150" y="188" width="40" height="62" className="dr-card" />
        <path d="M150 202H190" className="dr-thin" />

        {/* a fern */}
        <path d="M240 210Q232 172 210 162M240 210Q236 162 228 140M240 210Q242 160 246 134M240 210Q250 170 268 152M240 210Q258 188 276 184" className="dr-line" />
        <path d="M216 250 222 208H258L264 250Z" className="dr-card" />

        {/* the desk */}
        <rect x="300" y="162" width="520" height="88" className="dr-card" />
        {[0, 1, 2, 3].map((index) => (
          <rect key={index} x={314 + index * 127} y="174" width="111" height="64" className="dr-thin" />
        ))}
        <rect x="288" y="150" width="544" height="12" className="dr-card" />
        <rect x="496" y="195" width="128" height="23" className="dr-brass" />
        <text x="560" y="211" textAnchor="middle" fontSize="11" className="dr-text">
          RECEPTION
        </text>

        {/* a bell */}
        <path d="M331 144A16 16 0 0 1 363 144Z" className="dr-brass" />
        <rect x="327" y="144" width="40" height="6" className="dr-night" />
        <rect x="345.500" y="122" width="3" height="7" className="dr-solid" />
        <circle cx="347" cy="120" r="3.200" className="dr-brass" />

        {/* the ledger, open, and a pen */}
        <path d="M400 150V143Q430 135 460 143Q490 135 520 143V150Z" className="dr-card" />
        <path d="M460 143V150M412 144.500Q430 139.500 450 144.500M470 144.500Q490 139.500 508 144.500" className="dr-thin" />
        <path d="M530 150 558 116" className="dr-line" />

        {/* a lamp */}
        <rect x="640" y="110" width="4" height="34" className="dr-brass" />
        <rect x="622" y="144" width="40" height="6" className="dr-brass" />
        <path d="M612 112H672L664 92H620Z" className="dr-wax" />

        {/* the practice box, with its card on a string */}
        <rect x="722" y="118" width="66" height="32" className="dr-card" />
        <path d="M722 128H788" className="dr-thin" />
        <rect x="722" y="118" width="8" height="32" className="dr-brass" />
        <rect x="780" y="118" width="8" height="32" className="dr-brass" />
        <circle cx="755" cy="139" r="6" className="dr-brass" />
        <path d="M755 139V134.500" className="dr-thin" />
        <path d="M788 134Q804 136 806 168" className="dr-thin" />
        <rect x="792" y="168" width="30" height="20" rx="3" className="dr-bone" />
        <circle cx="798" cy="174" r="1.800" className="dr-solid" />

        {/* the rope across the way to the rooms, and the sign over it */}
        <path d="M1000 0V54M1080 0V54" className="dr-thin" />
        <rect x="968" y="54" width="144" height="42" className="dr-card" />
        <text x="1022" y="81" textAnchor="middle" fontSize="15" className="dr-text">
          ROOMS
        </text>
        <path d="M1068 75H1094M1086 68 1094 75 1086 82" className="dr-line" />
        <path d="M930 166Q1040 228 1150 166" className="dr-rope" />
        {[930, 1150].map((x) => (
          <g key={x}>
            <rect x={x - 3} y="158" width="6" height="86" className="dr-brass" />
            <circle cx={x} cy="152" r="7" className="dr-brass" />
            <rect x={x - 14} y="244" width="28" height="6" className="dr-brass" />
          </g>
        ))}

        <path d="M0 250H1240" className="dr-line" />
      </svg>
    </div>
  );
}
