import { Bird } from '@/components/goldmaker/Bird';
import { Sign } from '@/components/goldmaker/Sign';
import type { PaperDef } from '@/lib/goldmaker/shape';

/** Text as it was written: a blank line starts a paragraph, a single break is kept. */
function Paragraphs({ body, dropcap = false }: { body: string; dropcap?: boolean }) {
  return (
    <div className="prose">
      {body.split(/\n\s*\n/).map((paragraph, index) => (
        <p key={index} className={dropcap && index === 0 ? 'dropcap' : undefined} style={{ whiteSpace: 'pre-line' }}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

/**
 * Something that is read. A paper is one of three things: plain text, the
 * chart of the seven metals, or the old master's book of four birds.
 */
export function Paper({ paper }: { paper: PaperDef }) {
  return (
    <div data-testid={`paper-${paper.id}`}>
      {paper.kind === 'text' ? <Paragraphs body={paper.body} dropcap /> : null}

      {paper.kind === 'chart' ? (
        <>
          <p className="text-[1.2rem] italic">{paper.head}</p>
          <table className="chart mt-4">
            <thead>
              <tr>
                <th scope="col">
                  <span className="hidden-text">Sign</span>
                </th>
                <th scope="col">Metal</th>
                <th scope="col">Planet</th>
                <th scope="col">How it is known</th>
              </tr>
            </thead>
            <tbody>
              {paper.rows.map((row) => (
                <tr key={row.sign}>
                  <td>
                    <Sign id={row.sign} />
                  </td>
                  <th scope="row">{row.metal}</th>
                  <td>{row.planet}</td>
                  <td>{row.known}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      {paper.kind === 'book' ? (
        <>
          <p className="text-[1.2rem] italic">{paper.head}</p>
          <ol className="leaves mt-6">
            {paper.leaves.map((leaf) => (
              <li key={leaf.bird} className="leaf">
                <Bird id={leaf.bird} size={96} />
                <div>
                  <h3 className="title title--3">{leaf.name}</h3>
                  <p className="label mt-1">{leaf.colour}</p>
                  {leaf.verse ? <p className="mt-2">{leaf.verse}</p> : <p className="leaf__cut mt-2">{leaf.gone}</p>}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-7">{paper.colophon}</p>
        </>
      ) : null}

      {paper.note ? <p className="vellum__note">{paper.note}</p> : null}
    </div>
  );
}
