import { cx } from '@/lib/format';

export interface RedactionProps {
  /** The part that is never hidden, e.g. "Time of death". */
  label: string;
  /** The value behind the bar. Leave empty and the bar stays down. */
  value?: string | null;
  className?: string;
}

/**
 * A line of the file with its answer blacked out: "Time of death: ████".
 * When `value` arrives the bar lifts and the value shows in orange. There is
 * no animation: one moment it is hidden, the next it is not.
 */
export function Redaction({ label, value, className }: RedactionProps) {
  const lifted = typeof value === 'string' && value.length > 0;

  return (
    <p className={cx('document', className)} aria-live="polite">
      <span>{label}: </span>
      {lifted ? (
        <span className="ember" data-testid="redaction-value">
          {value}
        </span>
      ) : (
        <>
          <span className="redaction__bar" aria-hidden="true" />
          <span className="visually-hidden">redacted</span>
        </>
      )}
    </p>
  );
}
