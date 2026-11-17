import type { ReactNode } from 'react';

export interface PageHeadProps {
  /** The small line above the title. */
  label: string;
  title: ReactNode;
  children?: ReactNode;
}

/** The top of a page that is not the home page: a label, a title, a few lines. */
export function PageHead({ label, title, children }: PageHeadProps) {
  return (
    <section className="wrap pb-14 pt-14 md:pb-20 md:pt-24">
      <p className="label">{label}</p>
      <h1 className="display display--2 mt-5 max-w-[14em]">{title}</h1>
      {children ? <div className="lede mt-7">{children}</div> : null}
    </section>
  );
}
