import Link from 'next/link';
import { Arrow } from '@/components/site/Arrow';
import { Corridor } from '@/components/site/Corridor';
import { RoomPlate, SealedPlate } from '@/components/site/RoomPlate';
import { SITE } from '@/lib/site/brand';
import { ASHGROVE, OPEN_ROOMS, SEALED_ROOMS } from '@/lib/site/catalogue';

// The home page: the corridor, and the doors off it.

const STEPS = [
  {
    head: 'Choose a door.',
    body: 'Every room has a front page. It tells you where you are, what happened there and what the rules are.',
  },
  {
    head: 'Play it in the browser.',
    body: 'There is nothing to install and no account to make. A phone will do. A bigger screen is kinder.',
  },
  {
    head: 'Take your time.',
    body: 'Nothing counts down. Help is there if you want it, and each room says what it costs before you take it.',
  },
  {
    head: 'Come back.',
    body: 'Your place is kept in the browser you played in. Close the tab. The door stays open.',
  },
] as const;

const HOUSE_RULES = [
  {
    head: 'Nothing to install.',
    body: 'A room is a web page. If you can read this, you can play.',
  },
  {
    head: 'No account.',
    body: 'You are not asked for an email address or a password before you start, or after.',
  },
  {
    head: 'No adverts.',
    body: 'Nothing in a room is trying to sell you something else.',
  },
  {
    head: 'Fair locks.',
    body: 'Everything you need to open a room is inside it. You will not need a search engine.',
  },
] as const;

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------- hero -- */}
      <section className="hero wrap" aria-labelledby="hero-title">
        <p className="label">{SITE.tagline}</p>
        <h1 id="hero-title" className="display display--1 mt-6 max-w-[11em]">
          Some doors were sealed <em>for a reason.</em>
        </h1>

        <div className="mt-8 grid items-end gap-x-12 gap-y-8 md:mt-12 md:grid-cols-12">
          <p className="lede md:col-span-7">
            {SITE.name} makes escape rooms you play in a browser. Every one is built from nothing: its own story, its
            own look, its own kind of lock. The first is open.
          </p>
          <div className="flex flex-wrap gap-3 md:col-span-5 md:justify-end">
            <a href="#rooms" className="btn">
              See the rooms
              <Arrow />
            </a>
            <Link href="/how-it-works" className="btn btn--ghost">
              How it works
            </Link>
          </div>
        </div>

        <Corridor />
      </section>

      {/* --------------------------------------------------------- rooms -- */}
      <section id="rooms" className="band band--flush" aria-labelledby="rooms-title">
        <div className="wrap">
          <div className="grid items-end gap-x-12 gap-y-6 md:grid-cols-12">
            <div className="md:col-span-7">
              <p className="label">The rooms</p>
              <h2 id="rooms-title" className="display display--2 mt-5">
                One open. The rest under wax.
              </h2>
            </div>
            <p className="quiet md:col-span-5">
              A room opens when it is finished and not before. Each has a front page of its own. Start there.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:mt-14">
            {OPEN_ROOMS.map((room) => (
              <RoomPlate key={room.slug} room={room} />
            ))}
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {SEALED_ROOMS.map((room) => (
              <SealedPlate key={room.number} room={room} />
            ))}
            <div className="flex flex-col justify-end py-2 md:pl-4">
              <p className="display display--4">No two alike.</p>
              <p className="quiet mt-3">
                Every room is made from nothing: a new story, a new look and a new kind of lock. None of them will
                look like the last. That is why there are not many.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- how -- */}
      <section className="band" aria-labelledby="how-title">
        <div className="wrap split">
          <div className="split__aside">
            <p className="label">How it works</p>
            <h2 id="how-title" className="display display--3 mt-5">
              Four things to know before you knock.
            </h2>
            <p className="mt-6">
              <Link href="/how-it-works" className="textlink">
                The longer version
              </Link>
            </p>
          </div>
          <ol className="steps">
            {STEPS.map((step, index) => (
              <li key={step.head} className="step">
                <span className="step__n" aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className="display display--4 mt-5">{step.head}</h3>
                <p className="mt-2 max-w-[26em] text-ink-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------- house rules -- */}
      <section className="band band--ink" aria-labelledby="rules-title">
        <div className="wrap split">
          <div className="split__aside">
            <p className="label">House rules</p>
            <h2 id="rules-title" className="display display--3 mt-5">
              Whatever is behind the door, these four hold.
            </h2>
          </div>
          <ul className="steps">
            {HOUSE_RULES.map((rule) => (
              <li key={rule.head} className="step">
                <h3 className="display display--3">{rule.head}</h3>
                <p className="lede mt-3 max-w-[24em] text-[1.0625rem]">{rule.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------------------------------------------- close -- */}
      <section className="band" aria-labelledby="close-title">
        <div className="wrap grid items-end gap-x-12 gap-y-8 md:grid-cols-12">
          <div className="md:col-span-8">
            <p className="label">
              File {ASHGROVE.number} · {ASHGROVE.title}
            </p>
            <h2 id="close-title" className="display display--2 mt-5">
              The first door is <em>open.</em>
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 md:col-span-4 md:justify-end">
            <a href={ASHGROVE.href} className="btn">
              {ASHGROVE.enter}
              <Arrow />
            </a>
            <Link href="/contact" className="btn btn--ghost">
              Write to us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
