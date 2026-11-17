/**
 * The mark: a disc of sealing wax with a keyhole through it.
 * Used beside the name, and as the site's icon (public/unsealed.svg).
 */
export function SealMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="11" fill="var(--wax)" />
      <path
        d="M12 6.2A3.1 3.1 0 0 0 10.45 11.985L9.3 17.8H14.7L13.55 11.985A3.1 3.1 0 0 0 12 6.2Z"
        fill="var(--bone)"
      />
    </svg>
  );
}

/**
 * The shapes of a pressed wax seal, centred on 0,0 and about 46 units in
 * radius: a disc, the six places the wax ran past it, the ring the stamp
 * left, and the keyhole. Flat colour, no shading.
 *
 * It is a group, not an <svg>, so the corridor drawing can place it on a door.
 */
export function SealShapes() {
  return (
    <g>
      <circle r="40" fill="var(--wax)" />
      <circle cx="31.9" cy="11.6" r="11" fill="var(--wax)" />
      <circle cx="-3" cy="33.9" r="12" fill="var(--wax)" />
      <circle cx="-32" cy="11.6" r="10" fill="var(--wax)" />
      <circle cx="-27.8" cy="-19.5" r="12" fill="var(--wax)" />
      <circle cx="11.6" cy="-32" r="11" fill="var(--wax)" />
      <circle cx="32" cy="-11.6" r="9" fill="var(--wax)" />
      <circle r="27" fill="none" stroke="var(--wax-deep)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d="M0 -15A7.5 7.5 0 0 0 -3.75 -1L-6.5 14H6.5L3.75 -1A7.5 7.5 0 0 0 0 -15Z" fill="var(--wax-deep)" />
    </g>
  );
}

/** A wax seal on its own, for a room that is still shut. */
export function WaxSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden="true" focusable="false">
      <SealShapes />
    </svg>
  );
}
