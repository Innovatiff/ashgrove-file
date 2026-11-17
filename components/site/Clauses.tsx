import type { ReactNode } from 'react';

export interface Clause {
  name: string;
  body: ReactNode;
}

/** A long page set out as numbered sections: the name in the margin, the matter beside it. */
export function Clauses({ clauses }: { clauses: readonly Clause[] }) {
  return (
    <section className="wrap pb-20 md:pb-28">
      {clauses.map((clause, index) => (
        <div key={clause.name} className="clause">
          <h2 className="display display--4">
            <span className="clause__n" aria-hidden="true">
              {index + 1}.
            </span>{' '}
            {clause.name}
          </h2>
          <div className="prose">{clause.body}</div>
        </div>
      ))}
    </section>
  );
}
