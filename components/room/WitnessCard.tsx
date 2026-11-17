import { Frame } from '@/components/ui/Frame';
import { PinnedPhoto } from '@/components/ui/PinnedPhoto';
import { cx } from '@/lib/format';
import type { Witness } from '@/lib/content';

export interface WitnessCardProps {
  witness: Witness;
  /** Heading level for the name. A room uses h2, the wall of five uses h3. */
  as?: 'h2' | 'h3';
  /** stacked: the photograph above the statement, for a narrow column. */
  layout?: 'side' | 'stacked';
  className?: string;
}

/**
 * A photograph pinned to the wall, and beside it what that person said. The
 * same statement, word for word, wherever the person appears.
 */
export function WitnessCard({ witness, as: Heading = 'h2', layout = 'side', className }: WitnessCardProps) {
  return (
    <div
      className={cx(
        'grid items-start gap-x-8 gap-y-6',
        layout === 'side' && 'sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]',
        className,
      )}
    >
      <PinnedPhoto
        src={witness.src}
        width={witness.width}
        height={witness.height}
        alt={witness.alt}
        caption={witness.caption}
        sizes="(min-width: 640px) 200px, 60vw"
        className={cx('mx-auto w-full', layout === 'side' ? 'max-w-[200px]' : 'max-w-[220px]')}
      />

      <Frame tone="panel" label="Statement" mark={witness.reference} className="px-5 pb-6 pt-8 md:px-7">
        <Heading className="title title--lead">{witness.name}</Heading>
        <p className="mono muted mt-3">{witness.role}</p>
        <div className="document paper mt-5 text-paper">
          {witness.statement.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </Frame>
    </div>
  );
}
