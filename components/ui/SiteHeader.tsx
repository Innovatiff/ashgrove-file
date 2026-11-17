import { FileLabel } from '@/components/ui/FileLabel';
import { LiveClock } from '@/components/ui/LiveClock';

/** The strip at the top of every page: the file label, the local time, the Warden's hour. */
export function SiteHeader() {
  return (
    <header className="strip">
      <div className="measure flex flex-col gap-x-8 gap-y-1 py-3 md:flex-row md:items-center md:justify-between">
        <FileLabel />
        <p className="mono muted run">
          <span>
            Local <LiveClock />
            <span className="strip__slash" aria-hidden="true">
              /
            </span>
          </span>
          <span>
            The Warden’s hour: <span className="ember">03:17</span>
          </span>
        </p>
      </div>
    </header>
  );
}
