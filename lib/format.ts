const two = (n: number) => String(n).padStart(2, '0');

/** 21:14:07, in the viewer's own time zone. */
export function clockTime(date: Date): string {
  return `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`;
}

/** 21:14, in the viewer's own time zone. */
export function hourMinute(date: Date): string {
  return `${two(date.getHours())}:${two(date.getMinutes())}`;
}

/** Elapsed time as HH:MM:SS. Hours keep counting past 99. */
export function elapsed(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  return `${two(Math.floor(total / 3600))}:${two(Math.floor((total % 3600) / 60))}:${two(total % 60)}`;
}

/** 0412: a ledger count, never narrower than four digits. */
export function ledgerCount(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(4, '0');
}

/** Joins class names, skipping anything falsy. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
