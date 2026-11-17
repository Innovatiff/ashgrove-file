'use client';

import Link from 'next/link';
import { useProgress } from '@/components/providers/ProgressProvider';
import { cx } from '@/lib/format';
import { THRESHOLD_ROUTE } from '@/lib/rooms';

function Slash() {
  return (
    <span className="strip__slash" aria-hidden="true">
      /
    </span>
  );
}

/**
 * The file label strip: FILE 001 / ASHGROVE / SEALED 14.XI.1949 / DET. {NAME}.
 * The name is whatever the detective signed at the Oath, and UNASSIGNED
 * until they have.
 */
export function FileLabel({ className }: { className?: string }) {
  const { progress } = useProgress();

  return (
    <p className={cx('mono run', className)}>
      <span>
        <Link href={THRESHOLD_ROUTE}>
          File 001
          <Slash />
          Ashgrove
          <span className="visually-hidden">, front page</span>
        </Link>
        <Slash />
      </span>
      <span>
        Sealed 14.XI.1949
        <Slash />
      </span>
      <span>
        Det. <span data-testid="detective-name">{progress.detectiveName ?? 'Unassigned'}</span>
      </span>
    </p>
  );
}
