import type { Metadata } from 'next';
import { Bird } from '@/components/goldmaker/Bird';
import { Photo } from '@/components/goldmaker/Photo';
import { Warrant } from '@/components/goldmaker/Warrant';
import { frontPictures } from '@/lib/goldmaker/pictures.generated';

// The front page of File 002: what a visitor reads before they decide to go
// in. It is the only page of the room whose words are in the bundle. What is
// inside the cellar is not here.

export const metadata: Metadata = {
  title: { absolute: 'The Gold-Maker · File 002' },
};

const CELLAR_ALT =
  'A vaulted stone cellar fitted out as a laboratory, lit by one candle. Two furnaces stand against the far wall, one small and glowing, one great and cold. A workbench runs down the right-hand wall with a bar of gold on a red cloth. On the left are a lectern, a wall cupboard, a mirror and an open strongbox. A stuffed crocodile hangs from the vault.';

const WAYS = [
  {
    bird: 'raven',
    title: 'Search it by hand',
    body: 'There is one room, and all of it is in front of you. Whatever you can see, you can go and look at.',
  },
  {
    bird: 'swan',
    title: 'Try things',
    body: 'A flame, a lodestone, a pair of tongs, the touchstone you carry. Put a tool to a thing and the cellar tells you what comes of it. Nothing is typed.',
  },
  {
    bird: 'eagle',
    title: 'Take your time',
    body: 'Nothing counts down. The captain of the guard answers questions through the hatch, and every answer is marked against your name. So is every wrong setting of a lock.',
  },
  {
    bird: 'phoenix',
    title: 'Get out, and say how',
    body: 'The room is finished when you are standing outside it and can tell the Emperor three things, and show how you know each one.',
  },
] as const;

const FACTS = [
  ['The room', 'One cellar'],
  ['It takes', 'About an hour'],
  ['The order', 'Any you like'],
  ['Your place', 'Kept in this browser'],
] as const;

export default function GoldmakerFrontPage() {
  return (
    <>
      <section aria-labelledby="title">
        <Photo picture={{ ...frontPictures.cellar, alt: CELLAR_ALT }} sizes="100vw" className="hero__photo" priority />
        <div className="wrap pb-14 pt-10 md:pb-20 md:pt-14">
          <p className="label">File 002 · Prague, 1593</p>
          <h1 id="title" className="title title--1 mt-3">
            The Gold-Maker
          </h1>
          <p className="lede mt-6 max-w-[34ch]">
            The Emperor’s gold-maker barred his cellar from the inside. By morning there was gold on the bench and nobody
            in the room.
          </p>
          <p className="mt-8">
            <a href="#warrant" className="btn btn--solid" data-testid="hero-enter">
              Go down to the cellar
            </a>
          </p>
        </div>
      </section>

      <div className="wrap">
        <div className="rule" aria-hidden="true" />
      </div>

      <section className="wrap grid gap-10 py-14 md:py-20 lg:grid-cols-2 lg:gap-14" aria-label="What happened">
        <article className="vellum prose" aria-labelledby="says-prague">
          <p className="label">The first account</p>
          <h2 id="says-prague" className="title title--2 mt-2">
            What Prague says
          </h2>
          <p className="dropcap mt-6">
            On the eve of Saint John, Kaspar Rabe went down to his cellar in the Old Town of Prague and dropped the bar
            across the door, in front of the Emperor’s own guard. He had promised the Emperor gold by morning.
          </p>
          <p>
            At first light the guard took an axe to that bar. The small furnace was warm. A bar of gold lay on the bench.
            The cellar has one door, and Rabe was not behind it.
          </p>
          <p>The city has settled the matter. He made gold at last, and the Devil came down to collect.</p>
        </article>

        <article className="prose self-center" aria-labelledby="says-emperor">
          <p className="label">The second account</p>
          <h2 id="says-emperor" className="title title--2 mt-2">
            What the Emperor says
          </h2>
          <p className="lede mt-6">The Emperor does not think the Devil takes an interest in gold-makers.</p>
          <p className="mt-4">
            He has sent for the one officer of his Mint whose whole trade is telling true gold from false. That is you.
          </p>
          <p>
            You will be shut in the cellar with everything as it was found, and you will stay there until you can say
            what the bar is, where his gold came from, and how a man leaves a room that is barred from the inside.
          </p>
        </article>
      </section>

      <section className="border-y border-line bg-verdigris py-14 md:py-20" aria-labelledby="how">
        <div className="wrap">
          <p className="label">Before you go down</p>
          <h2 id="how" className="title title--2 mt-2">
            How this room is played
          </h2>
          <div className="ways mt-10">
            {WAYS.map((way) => (
              <div key={way.bird} className="way">
                <Bird id={way.bird} />
                <div>
                  <h3 className="title title--3">{way.title}</h3>
                  <p className="mt-2 max-w-[44ch]">{way.body}</p>
                </div>
              </div>
            ))}
          </div>
          <dl className="facts mt-12">
            {FACTS.map(([term, detail]) => (
              <div key={term}>
                <dt className="label">{term}</dt>
                <dd className="mt-1 text-[1.2rem]">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="warrant" className="wrap py-14 md:py-20" aria-labelledby="warrant-title">
        <div className="vellum mx-auto max-w-[720px]">
          <p className="label">Under the Emperor’s seal</p>
          <h2 id="warrant-title" className="title title--2 mt-2">
            The warrant
          </h2>
          <p className="mt-6 text-[1.2rem]">
            The bearer, Assay-Master to the Imperial Mint, is to be shut in the cellar of Kaspar Rabe, gold-maker, and is
            to be let out for the truth of it and for nothing else.
          </p>
          <div className="mt-8">
            <Warrant />
          </div>
        </div>
      </section>
    </>
  );
}
