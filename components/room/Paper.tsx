import { Fragment } from 'react';
import { EvidenceCard } from '@/components/ui/EvidenceCard';
import type { RoomDocument, RoomTable } from '@/lib/content';

/**
 * One paper from a room: typed text, a ruled ledger, a page of cipher, or
 * text followed by either. Everything it shows arrived from Firestore.
 */
export function Paper({ paper, className }: { paper: RoomDocument; className?: string }) {
  const paragraphs = paper.body ? paper.body.split(/\n\s*\n/) : [];

  return (
    <EvidenceCard label={paper.label} reference={paper.reference} stamp={paper.note} className={className}>
      <div className="paper">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>
            {paragraph.split('\n').map((line, at) => (
              <Fragment key={at}>
                {at > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </p>
        ))}
        {paper.table ? <Ledger table={paper.table} name={paper.label} /> : null}
        {paper.cipher ? <CipherPage rows={paper.cipher} /> : null}
      </div>
    </EvidenceCard>
  );
}

/**
 * A ruled ledger. A real table on a wide screen. On a narrow one each row is
 * set as a short list, every value under the name of its column, so nothing
 * has to be scrolled sideways. The roles are stated outright so the table
 * stays a table to a screen reader either way.
 */
function Ledger({ table, name }: { table: RoomTable; name: string }) {
  return (
    <table className="ledger-table" role="table" aria-label={name}>
      <thead role="rowgroup">
        <tr role="row">
          {table.columns.map((column) => (
            <th key={column} role="columnheader" scope="col" className="mono">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody role="rowgroup">
        {table.rows.map((row, index) => (
          <tr key={index} role="row">
            {row.cells.map((cell, at) =>
              at === 0 ? (
                <th key={at} role="rowheader" scope="row" data-label={table.columns[at]}>
                  {cell}
                </th>
              ) : (
                <td key={at} role="cell" data-label={table.columns[at]}>
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Rows of capital letters in groups of five, numbered so a line can be named. */
function CipherPage({ rows }: { rows: string[] }) {
  return (
    <ol className="cipher" aria-label="Lines of cipher">
      {rows.map((row, index) => (
        <li key={index} className="cipher__row">
          <span className="cipher__number mono muted" aria-hidden="true">
            {index + 1}
          </span>
          <span className="cipher__letters">{row}</span>
        </li>
      ))}
    </ol>
  );
}
