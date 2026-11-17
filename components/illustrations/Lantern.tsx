import { Illustration } from '@/components/illustrations/Illustration';

/** A storm lantern on its hook. The flame is the one part in orange. */
export function Lantern({ className, title }: { className?: string; title?: string }) {
  return (
    <Illustration viewBox="0 0 240 420" className={className} title={title}>
      {/* centre line and height, as on a maker's plate */}
      <path className="faint dashed" d="M120 0V420" />
      <path className="faint" d="M22 112V368M16 112H28M16 368H28" />

      {/* hook and ring */}
      <path d="M120 75V20C120 6 140 6 140 20" />
      <circle cx="120" cy="84" r="9" />

      {/* bail */}
      <path d="M54 168C54 66 186 66 186 168" />

      {/* chimney cap */}
      <path d="M100 112H140L148 130H92Z" />
      <rect x="96" y="130" width="48" height="16" />
      <circle cx="104" cy="138" r="2" />
      <circle cx="112" cy="138" r="2" />
      <circle cx="120" cy="138" r="2" />
      <circle cx="128" cy="138" r="2" />
      <circle cx="136" cy="138" r="2" />
      <path d="M90 146H150L156 158H84Z" />

      {/* frame tubes */}
      <path d="M84 152C70 148 54 150 54 168V318" />
      <path d="M156 152C170 148 186 150 186 168V318" />
      <path className="faint" d="M66 172V308M174 172V308" />

      {/* globe and guard wires */}
      <path d="M96 158C66 190 66 246 100 276H140C174 246 174 190 144 158" />
      <path d="M75 198C100 216 140 216 165 198" />
      <path d="M77 236C100 252 140 252 163 236" />
      <path className="faint" d="M84 178L156 262M156 178L84 262" />

      {/* burner and wick wheel */}
      <rect x="102" y="276" width="36" height="14" />
      <path d="M138 284H160" />
      <circle cx="165" cy="284" r="5" />
      <path d="M120 276V268" />

      {/* font */}
      <path d="M70 304H170L186 320V356H54V320Z" />
      <rect x="148" y="296" width="14" height="8" />
      <path d="M48 356H192V368H48Z" />
      <path className="faint" d="M54 332H186M54 344H186" />

      {/* the flame */}
      <path className="ember" d="M120 268C106 250 114 232 120 212C126 232 134 250 120 268Z" />
    </Illustration>
  );
}
