import { Frame } from '@/components/ui/Frame';

export interface ClearanceProps {
  /** checking: still reading the file. denied: sending the visitor back. error: nothing can load. */
  state: 'checking' | 'denied' | 'error';
}

const LINES: Record<ClearanceProps['state'], { head: string; body: string }> = {
  checking: { head: 'Checking your clearance', body: 'The archive is reading your file.' },
  denied: { head: 'This part of the file is sealed', body: 'You are being returned to the last room that is open to you.' },
  error: { head: 'The archive is not answering', body: 'Nothing has been lost. Check your connection and reload the page.' },
};

/** What a visitor sees while the gate decides, instead of a flash of a room. */
export function Clearance({ state }: ClearanceProps) {
  const line = LINES[state];
  return (
    <div className="measure flex flex-1 items-center justify-center py-24">
      <Frame label="Clearance" className="w-full max-w-xl px-6 py-10 text-center" role="status" aria-live="polite">
        <p className="mono mono--lg text-paper">{line.head}</p>
        <p className="muted mt-3">{line.body}</p>
      </Frame>
    </div>
  );
}
