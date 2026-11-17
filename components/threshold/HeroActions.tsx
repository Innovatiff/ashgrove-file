'use client';

import Link from 'next/link';
import { useProgress } from '@/components/providers/ProgressProvider';

/**
 * The two buttons under the title. A first-time visitor is sent into the
 * file. A detective who has been here before is offered their place back.
 */
export function HeroActions() {
  const { progress } = useProgress();
  const returning = progress.ready && progress.thresholdSolved;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {returning ? (
        <Link href={progress.resumeRoute} className="btn btn--ember" data-testid="hero-primary">
          Resume the file
        </Link>
      ) : (
        <a href="#legend" className="btn btn--ember" data-testid="hero-primary">
          Open the file
        </a>
      )}
      <a href="#rules" className="btn">
        Read the rules of entry
      </a>
    </div>
  );
}
