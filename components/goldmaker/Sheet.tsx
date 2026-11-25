'use client';

import { type MouseEvent, type ReactNode, useEffect, useId, useRef } from 'react';
import { cx } from '@/lib/format';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Something that is read: set on vellum. Otherwise it is part of the room. */
  vellum?: boolean;
  /** As wide as the window allows, with nothing round what is in it: for a photograph. */
  wide?: boolean;
  testId?: string;
  children: ReactNode;
}

/**
 * Something laid over the cellar for a moment: a paper being read, the
 * captain at his hatch, the notes. It is the browser's own <dialog>, so the
 * rest of the page is out of reach while it is open, Escape closes it and
 * the focus goes back to where it came from.
 */
export function Sheet({ open, onClose, title, vellum = false, wide = false, testId, children }: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();

  // Whether the page wants it open. The dialog also reports a close that the
  // page itself asked for, and that one must not be passed on: by then the
  // page may already have opened something else.
  const wanted = useRef(open);
  useEffect(() => {
    wanted.current = open;
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  // Closed by the visitor: Escape, or the browser's own way out.
  const closed = () => {
    if (wanted.current) onClose();
  };

  // A click on the dark around the sheet closes it. A click inside does not.
  const outside = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialog.current) onClose();
  };

  return (
    <dialog ref={dialog} className={cx('sheet', vellum && 'sheet--vellum', wide && 'sheet--wide')} aria-labelledby={id} onClose={closed} onClick={outside} data-testid={testId}>
      {open ? (
        <>
          <div className="sheet__head">
            <h2 id={id} className="title title--3">
              {title}
            </h2>
            <button type="button" className="btn btn--small" onClick={onClose} data-testid="sheet-close">
              Close
            </button>
          </div>
          <div className={vellum ? 'vellum' : wide ? undefined : 'sheet__body'}>{children}</div>
        </>
      ) : null}
    </dialog>
  );
}
