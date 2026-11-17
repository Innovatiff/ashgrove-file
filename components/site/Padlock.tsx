/** A small brass padlock. Decorative. */
export function Padlock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 38" className={className} aria-hidden="true" focusable="false">
      <path d="M8 17V11A7 7 0 0 1 22 11V17" className="dr-line" />
      <rect x="2.500" y="16.500" width="25" height="19" rx="2" className="dr-brass" />
      <circle cx="15" cy="24" r="2.400" className="dr-solid" />
      <rect x="14" y="25" width="2" height="5.500" className="dr-solid" />
    </svg>
  );
}
