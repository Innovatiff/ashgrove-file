import type { Metadata } from 'next';
import Link from 'next/link';
import { Arrow } from '@/components/site/Arrow';
import { type Clause, Clauses } from '@/components/site/Clauses';
import { PageHead } from '@/components/site/PageHead';
import { SITE } from '@/lib/site/brand';
import { ASHGROVE } from '@/lib/site/catalogue';

export const metadata: Metadata = {
  title: 'About',
  description: `${SITE.name} makes escape rooms for the browser. What a room is, how they are made and the four rules every one of them keeps.`,
};

const SECTIONS: readonly Clause[] = [
  {
    name: 'What a room is',
    body: (
      <>
        <p>
          A room is a complete thing. It has a place, a story, a set of locks and one way out. You read what is there,
          work out what it means and prove it.
        </p>
        <p>Nothing in a room is random, and nothing is there to waste your time.</p>
      </>
    ),
  },
  {
    // The front page is photographs of a building. This is where the site
    // says, in plain words, that nobody can visit it.
    name: 'Where the building is',
    body: (
      <>
        <p>
          Nowhere you can walk to. {SITE.name} has no street address and no front desk. Every room is a web page, and
          the way in is the one you are using now.
        </p>
        <p>
          The reception, the corridor and the lockers on the front page are the place as we picture it. Those pictures
          were made for this site. They were not taken in a real building.
        </p>
      </>
    ),
  },
  {
    name: 'How they are made',
    body: (
      <>
        <p>
          Every room starts from nothing. It gets its own setting, its own look and its own kind of puzzle, so that the
          second room is not the first one again with the names changed.
        </p>
        <p>
          That is slow work. It is why the catalogue is short, and why a room stays sealed until it is finished.
        </p>
      </>
    ),
  },
  {
    name: 'What every room keeps to',
    body: (
      <ul>
        <li>
          <strong>Nothing to install.</strong> A room is a web page.
        </li>
        <li>
          <strong>No account.</strong> You are not asked for an email address or a password. Your place is kept in
          your browser.
        </li>
        <li>
          <strong>No adverts.</strong> Nothing in a room is trying to sell you something else.
        </li>
        <li>
          <strong>Fair locks.</strong> The answer is always in the room. It never depends on something you would have
          to look up.
        </li>
      </ul>
    ),
  },
  {
    name: 'What is open',
    body: (
      <>
        <p>
          File {ASHGROVE.number}, <a href={ASHGROVE.href}>{ASHGROVE.title}</a>, is open. It is a murder mystery
          set in England in 1949: seven rooms, one code for each, and at the end you name the killer.
        </p>
        <p>The next rooms are being made. They will not look like it.</p>
      </>
    ),
  },
  {
    name: 'Say something',
    body: (
      <p>
        If a lock is broken, a sentence is wrong or a room beat you unfairly, we want to know.{' '}
        <Link href="/contact">Write to us</Link>.
      </p>
    ),
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHead
        label="About"
        title={
          <>
            We build rooms. <em>Then we lock them.</em>
          </>
        }
      >
        <p>
          {SITE.name} makes escape rooms for the browser: stories you get out of by reading closely and thinking
          straight.
        </p>
      </PageHead>

      <Clauses clauses={SECTIONS} />

      <section className="band band--ink" aria-labelledby="about-start">
        <div className="wrap grid items-end gap-x-12 gap-y-8 md:grid-cols-12">
          <div className="md:col-span-8">
            <p className="label">
              File {ASHGROVE.number} · {ASHGROVE.title}
            </p>
            <h2 id="about-start" className="display display--2 mt-5">
              Start with the one that is open.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 md:col-span-4 md:justify-end">
            <a href={ASHGROVE.href} className="btn btn--bone">
              {ASHGROVE.enter}
              <Arrow />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
