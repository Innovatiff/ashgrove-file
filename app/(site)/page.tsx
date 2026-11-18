import Link from 'next/link';
import { preload } from 'react-dom';
import { Arrow } from '@/components/site/Arrow';
import { largestOf, Photo, srcSetOf } from '@/components/site/Photo';
import { PracticeBox } from '@/components/site/PracticeBox';
import { RoomPlate } from '@/components/site/RoomPlate';
import { TodayBoard } from '@/components/site/TodayBoard';
import { SITE } from '@/lib/site/brand';
import { ASHGROVE, OPEN_ROOMS, SEALED_ROOMS } from '@/lib/site/catalogue';
import { CLOCK_FAST_MINUTES, LET_OUT_BY_THE_CLOCK } from '@/lib/site/practice';

// The home page is a walk through a place, in the order a visitor would walk
// it: in at reception, to the desk and the box that sits on it, past the
// notices and the lockers, and down the corridor the rooms open off. Each
// stop is a photograph of it.
//
// Everything said here about a room is something the room's own front page
// already says in public.

const BRIEFING = [
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

// What a visitor can leave in a locker, because no room will ask for it.
const LOCKERS = [
  {
    leave: 'Installers',
    head: 'Nothing to install.',
    body: 'A room is a web page. If you can read this, you can play.',
  },
  {
    leave: 'Passwords',
    head: 'No account.',
    body: 'You are not asked for an email address or a password before you start, or after.',
  },
  {
    leave: 'Your wallet',
    head: 'No adverts.',
    body: 'Nothing in a room is trying to sell you something else.',
  },
  {
    leave: 'Search engines',
    head: 'Fair locks.',
    body: 'Everything you need to open a room is inside it. You will not need to look anything up.',
  },
] as const;

const RECEPTION_SIZES = '100vw';

export default function HomePage() {
  // The reception is the first thing on the page and the largest. Ask for it
  // before the browser has read as far as the picture itself.
  preload(largestOf('reception'), {
    as: 'image',
    imageSrcSet: srcSetOf('reception'),
    imageSizes: RECEPTION_SIZES,
    fetchPriority: 'high',
  });

  const sealed = SEALED_ROOMS.map((room) => room.number);

  return (
    <>
      {/* ----------------------------------------------------- reception -- */}
      <section className="entrance" aria-labelledby="hero-title">
        <figure className="photo-wide entrance__photo">
          <Photo
            name="reception"
            sizes={RECEPTION_SIZES}
            priority
            alt={`The reception of ${SITE.name}, seen from the front door. A dark oak desk with a brass bell, an open ledger, a lamp with a red glass shade and a small locked box. On the wall behind it, brass letters spell ${SITE.name.toUpperCase()} between a round wall clock and a rack of keys: one key hangs on the first hook, and a sealed envelope on each of the other four. To the right, a red rope hangs across a corridor of doors, under a sign that reads ROOMS.`}
          />
        </figure>

        <div className="wrap entrance__below">
          <div className="entrance__card">
            <p className="label">{SITE.tagline}</p>
            <h1 id="hero-title" className="display entrance__title mt-5">
              Come in. Solve the <em>mystery.</em>
            </h1>
            <p className="lede mt-6">
              You have just walked into {SITE.name}. Down the corridor are locked rooms, and in each one something
              happened that nobody has explained. Read what was left behind. Work out what really happened. Prove it.
            </p>

            <ul className="keytags mt-6" aria-label="Before you ask">
              <li className="keytag">Played in your browser</li>
              <li className="keytag">Nothing to install</li>
              <li className="keytag">No account</li>
              <li className="keytag">File {ASHGROVE.number} is free</li>
            </ul>

            <div className="entrance__actions flex flex-wrap gap-3">
              {/* A plain anchor: the room has a layout of its own, so this is a full page load. */}
              <a href={ASHGROVE.href} className="btn" data-testid="hero-enter">
                Take key {ASHGROVE.number}
                <span className="visually-hidden">: {ASHGROVE.title}</span>
                <Arrow />
              </a>
              <a href="#desk" className="btn btn--ghost">
                Look around first
              </a>
            </div>
          </div>

          <div className="entrance__side">
            <TodayBoard open={OPEN_ROOMS} sealed={SEALED_ROOMS} />

            {/* The key itself. The words beside it say what it is, so the
                picture needs no description of its own. */}
            <a href={ASHGROVE.href} className="keyshot" data-testid="key-ashgrove">
              <Photo name="key" sizes="(min-width: 64rem) 36vw, 100vw" alt="" />
              <span className="keyshot__note">
                <span>
                  Key {ASHGROVE.number} is on its hook. Take it
                  <span className="visually-hidden">: {ASHGROVE.title}</span>
                </span>
                <Arrow />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- the practice box -- */}
      <section id="desk" className="band band--flush" aria-labelledby="desk-title">
        <div className="wrap split">
          <div className="split__aside">
            <p className="label">On the desk</p>
            <h2 id="desk-title" className="display display--3 mt-5">
              A box nobody has opened today.
            </h2>
            <p className="mt-5 text-ink-2">
              Every room here works the way this box does. The answer is in front of you, and one thing in the room is
              not telling you the truth.
            </p>
            <p className="mt-3 text-ink-2">Try it. It takes a minute, and it is the whole idea.</p>
          </div>

          <div>
            <figure>
              <Photo
                name="desk"
                sizes="(min-width: 64rem) 70vw, 100vw"
                className="photo"
                alt="The reception desk, close up. A small wooden box bound in brass is shut with a combination padlock, and a blank paper tag is tied to it with string. Beside it lie an open ledger with a fountain pen across it and a brass bell, under a lamp with a red glass shade. On the wall behind, the bottom of the clock, and a brass plate fixed under it."
              />
              <figcaption className="photo__note">The box, on the reception desk. The plate is on the wall behind it.</figcaption>
            </figure>

            <ol className="exhibits mt-8">
              <li className="exhibit">
                <div className="exhibit__thing">
                  <p className="brass-plate">This clock runs {CLOCK_FAST_MINUTES} minutes fast. Leave it.</p>
                </div>
                <p className="quiet text-[0.9375rem]">What the plate under the lobby clock says.</p>
              </li>
              <li className="exhibit">
                <div className="exhibit__thing">
                  <p className="ledger-page">
                    Party of four. Room 001.
                    <br />
                    In for the full hour.
                    <br />
                    Let out when the lobby clock read {LET_OUT_BY_THE_CLOCK}.
                  </p>
                </div>
                <p className="quiet text-[0.9375rem]">The last entry in the desk ledger.</p>
              </li>
              <li className="exhibit">
                <div className="exhibit__thing">
                  <p className="tagcard">
                    <strong className="font-semibold">Practice box.</strong> When did they go in? Give the time as it
                    really was.
                  </p>
                </div>
                <p className="quiet text-[0.9375rem]">The other side of the tag tied to the box.</p>
              </li>
            </ol>

            <div className="mt-10">
              <PracticeBox href={ASHGROVE.href} enter={`Take key ${ASHGROVE.number}`} />
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- the briefing -- */}
      <section className="band" aria-labelledby="briefing-title">
        <div className="wrap grid items-center gap-x-14 gap-y-10 lg:grid-cols-12">
          <figure className="lg:col-span-5">
            <Photo
              name="notices"
              sizes="(min-width: 64rem) 40vw, 100vw"
              className="photo"
              alt="A cork notice board in a dark oak frame, under a brass plate that reads NOTICES. Four cards are pinned to it with red pins, numbered 1 to 4 in red ink. A brass wall lamp is lit beside it, and a doorway next to it opens on the corridor."
            />
            <figcaption className="photo__note">The notice board, by the way through to the corridor.</figcaption>
          </figure>

          <div className="lg:col-span-7">
            <p className="label">The briefing</p>
            <h2 id="briefing-title" className="display display--2 mt-5">
              What you would be told at the door.
            </h2>
            <ol className="steps mt-10">
              {BRIEFING.map((note, index) => (
                <li key={note.head} className="step">
                  <span className="step__n" aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3 className="display display--4 mt-4">{note.head}</h3>
                  <p className="mt-2 text-ink-2">{note.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-2">
              <Link href="/how-it-works" className="textlink">
                The longer version
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- the lockers -- */}
      <section className="band band--ink" aria-labelledby="lockers-title">
        <div className="wrap grid items-center gap-x-14 gap-y-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="label">The lockers</p>
            <h2 id="lockers-title" className="display display--2 mt-5">
              Leave these here. You will not need them.
            </h2>
            <p className="lede mt-6">Four things no room in this building will ask you for, whatever is behind its door.</p>

            <ul className="steps mt-10">
              {LOCKERS.map((locker, index) => (
                <li key={locker.leave} className="step">
                  <p className="label">
                    Locker {String(index + 1).padStart(2, '0')} · {locker.leave}
                  </p>
                  <h3 className="display display--3 mt-3">{locker.head}</h3>
                  <p className="quiet mt-2">{locker.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <figure className="lg:col-span-5">
            <Photo
              name="lockers"
              sizes="(min-width: 64rem) 40vw, 100vw"
              className="photo"
              alt="Four tall cream steel lockers, numbered 01 to 04 on brass plates, each shut with a brass padlock. A worn oak bench stands in front of them, a lit wall lamp hangs above, and a red velvet curtain is tied back beside them."
            />
            <figcaption className="photo__note">The lockers, off the corridor.</figcaption>
          </figure>
        </div>
      </section>

      {/* --------------------------------------------------- the corridor -- */}
      <section id="rooms" className="band" aria-labelledby="rooms-title">
        <div className="wrap grid items-end gap-x-12 gap-y-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="label">The corridor</p>
            <h2 id="rooms-title" className="display display--2 mt-5">
              One door is open. The rest are under wax.
            </h2>
          </div>
          <p className="quiet md:col-span-5">
            A room opens when it is finished and not before. No two are alike: each has its own story, its own look
            and its own kind of lock.
          </p>
        </div>

        <figure className="photo-wide corridor-photo">
          <Photo
            name="corridor"
            sizes="100vw"
            alt="One wall of the corridor, with five doors side by side and no two alike, each under a brass plate numbered from 001 to 005. Door 001, a plain cream door, stands open, and warm light spills from it across the chequered floor. The other four are shut and sealed with red wax: an arched door of oak planks, a round steel vault door, a pair of double doors under a pediment, and a door only knee high."
          />
        </figure>

        <div className="wrap">
          <div className="mt-10 grid gap-6 md:mt-14">
            {OPEN_ROOMS.map((room) => (
              <RoomPlate key={room.slug} room={room} />
            ))}
          </div>

          <div className="mt-10 grid items-center gap-x-14 gap-y-10 md:mt-14 lg:grid-cols-12">
            <figure className="lg:col-span-7">
              <Photo
                name="keys"
                sizes="(min-width: 64rem) 56vw, 100vw"
                className="photo"
                alt="The key rack: five brass hooks under plates numbered 001 to 005. A brass key hangs from the first, with a paper tag stamped OPEN in red. From each of the other four hangs an envelope sealed with red wax."
              />
              <figcaption className="photo__note">The key rack, behind the desk.</figcaption>
            </figure>

            <div className="lg:col-span-5">
              <p className="label">Hooks {sealed.length > 1 ? `${sealed[0]} to ${sealed[sealed.length - 1]}` : sealed[0]}</p>
              <p className="display display--3 mt-4">Under wax until they are finished.</p>

              <p className="stamp mt-10">A dare</p>
              <p className="display display--3 mt-5">
                File {ASHGROVE.number} says most detectives close the tab at Room III.
              </p>
              <p className="mt-4 text-ink-2">
                It is on the front page, where you can read it before you go in. Go in anyway.
              </p>
              <a href={ASHGROVE.href} className="btn mt-7" data-testid="keys-enter">
                Take key {ASHGROVE.number}
                <span className="visually-hidden">: {ASHGROVE.title}</span>
                <Arrow />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- the door -- */}
      <section className="band" aria-labelledby="close-title">
        <div className="wrap grid items-center gap-x-14 gap-y-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="label">
              File {ASHGROVE.number} · {ASHGROVE.title}
            </p>
            <h2 id="close-title" className="display display--2 mt-5">
              The first door is open. Solve the <em>mystery.</em>
            </h2>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={ASHGROVE.href} className="btn">
                {ASHGROVE.enter}
                <Arrow />
              </a>
              <Link href="/contact" className="btn btn--ghost">
                Write to us
              </Link>
            </div>
          </div>

          <figure className="lg:col-span-5">
            <Photo
              name="door"
              sizes="(min-width: 64rem) 40vw, 100vw"
              className="photo"
              alt="Door 001, a cream panelled door in a dark oak frame, standing a little open. Warm orange light comes through the gap and falls across the chequered floor of the corridor. A key with a paper tag hangs in the lock, and a wall lamp is lit beside the door."
            />
            <figcaption className="photo__note">Room 001.</figcaption>
          </figure>
        </div>
      </section>
    </>
  );
}
