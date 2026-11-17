import type { ReactNode } from 'react';
import { Frame } from '@/components/ui/Frame';
import { cx } from '@/lib/format';

export interface EvidenceCardProps {
  /** What the paper is, e.g. "MAID'S STATEMENT". */
  label: string;
  /** Its reference on the file, e.g. "I-A". */
  reference?: string;
  /** A line across the foot of the card, e.g. "ADDED TO YOUR FILE". */
  stamp?: ReactNode;
  /** document: a paper found in a room. evidence: something the detective has established. */
  variant?: 'document' | 'evidence';
  className?: string;
  children: ReactNode;
}

/** A framed case document, set in Special Elite. */
export function EvidenceCard({ label, reference, stamp, variant = 'document', className, children }: EvidenceCardProps) {
  return (
    <Frame as="article" tone="panel" active={variant === 'evidence'} className={cx('flex h-full flex-col', className)}>
      <header className="mono muted flex items-center justify-between gap-4 border-b border-line px-4 py-2.5">
        <h3 className="mono">{label}</h3>
        {reference ? (
          <span>
            <span className="visually-hidden">Reference </span>
            {reference}
          </span>
        ) : null}
      </header>
      <div className="document flex-1 px-5 py-5 text-paper">{children}</div>
      {stamp ? <footer className="mono muted border-t border-line px-4 py-2.5">{stamp}</footer> : null}
    </Frame>
  );
}
