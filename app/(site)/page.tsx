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
import { ROOMS_IN_THE_PICTURES } from '@/lib/site/venue';

// The home page is a walk through a place, in the order a visitor would walk
// it: in at reception, to the desk and the box that sits on it, past the
// notices and the lockers, and down the corridor the rooms open off. Each
// stop is a photograph of it.
//
// Everything said here about a room is something the room's own front page
// already says in public.
//
// The photographs show two keys on their hooks and two doors standing open.
// The words that describe them are written out below and are true of those
// pictures only: when a third room opens the reception, the corridor and the
// key rack are retaken, and their descriptions here are written again
// (docs/image-prompts.md). Everything else on the page follows the catalogue.

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

const COUNT = ['No', 'One', 'Two', 'Three', 'Four', 'Five'] as const;
/** "One door is open." "Two doors are open." */
const doorsOpen = (n: number) => (n === 1 ? 'One door is open.' : `${COUNT[n] ?? n} doors are open.`);
/** "001", "001 and 002", "001, 002 and 003". */
const listed = (items: readonly string[]) =>
  items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

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
  // An open room that is in the photographs: its key and its door.
  const pictured = OPEN_ROOMS.flatMap((room) => {
    const pictures = ROOMS_IN_THE_PICTURES[room.slug];
    return pictures ? [{ room, pictures }] : [];
  });

  return (
    <>
      {/* ----------------------------------------------------- reception -- */}
      <section className="entrance" aria-labelledby="hero-title">
        <figure className="photo-wide entrance__photo">
          <Photo
            name="reception"
            sizes={RECEPTION_SIZES}
            priority
            alt={`The reception of ${SITE.name}, seen from the front door. A dark oak desk with a brass bell, an open ledger, a lamp with a red glass shade and a small locked box. On the wall behind it, brass letters spell ${SITE.name.toUpperCase()} between a round wall clock and a rack of keys: a key hangs on each of the first two hooks, and a sealed envelope on each of the other three. To the right, a red rope hangs across a corridor of doors, under a sign that reads ROOMS.`}
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
              {/* What each room costs, and no more than the room itself says. */}
              {OPEN_ROOMS.map((room) => (
                <li key={room.slug} className="keytag" data-testid={`price-${room.slug}`}>
                  File {room.number} is free{room.free === 'for now' ? ' for now' : ''}
                </li>
              ))}
            </ul>

            <div className="entrance__actions flex flex-wrap gap-3">
              {/* Plain anchors: a room has a layout of its own, so this is a full page load. */}
              {OPEN_ROOMS.map((room, index) => (
                <a key={room.slug} href={room.href} className="btn" data-testid={index === 0 ? 'hero-enter' : `hero-enter-${room.slug}`}>
                  Take key {room.number}
                  <span className="visually-hidden">: {room.title}</span>
                  <Arrow />
                </a>
              ))}
              <a href="#desk" className="btn btn--ghost">
                Look around first
              </a>
            </div>
          </div>

          <div className="entrance__side">
            <TodayBoard open={OPEN_ROOMS} sealed={SEALED_ROOMS} />

            {/* The keys themselves: one piece of the key rack, cut between
                the hooks, so that each key is the way into its own room. The
                words under each say what it is, so the pictures need no
                description of their own. */}
            <div className="keyshots" role="group" aria-label="The keys on their hooks">
              {pictured.map(({ room, pictures }) => (
                // The words under a key are short, because the first piece is
                // narrow. Its name in full is what a screen reader is given.
                <a
                  key={room.slug}
                  href={room.href}
                  className="keyshot"
                  aria-label={`Take key ${room.number}: ${room.title}`}
                  data-testid={`key-${room.slug}`}
                >
                  <Photo name={pictures.key} sizes={pictures.keySizes} alt="" />
                  <span className="keyshot__note">
                    <span>Key {room.number}</span>
                    <Arrow />
                  </span>
                </a>
              ))}
            </div>
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
              Every room here asks what this box asks. The answer is in front of you, and one thing in the room is not
              telling you the truth.
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
              {/* With one room open the card in the box points at its door. With more, at the corridor. */}
              {OPEN_ROOMS.length === 1 ? (
                <PracticeBox href={ASHGROVE.href} enter={`Take key ${ASHGROVE.number}`} />
              ) : (
                <PracticeBox href="#rooms" enter="Choose a door" />
              )}
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
              {doorsOpen(OPEN_ROOMS.length)}
              {sealed.length > 0 ? ' The rest are under wax.' : ''}
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
            alt="One wall of the corridor, with five doors side by side and no two alike, each under a brass plate numbered from 001 to 005. Door 001, a plain cream door, stands open, and warm lamplight spills from it across the chequered floor. Door 002, an arched door of oak planks on iron hinges, stands open beside it, with a fire burning inside against a rough stone wall. The other three are shut and sealed with red wax: a round steel vault door, a pair of double doors under a pediment, and a door only knee high."
          />
        </figure>

        <div className="wrap">
          <div className="mt-10 grid gap-6 md:mt-14">
            {OPEN_ROOMS.map((room, index) => (
              <RoomPlate key={room.slug} room={room} first={index === 0} />
            ))}
          </div>

          <div className="mt-10 grid items-center gap-x-14 gap-y-10 md:mt-14 lg:grid-cols-12">
            <figure className="lg:col-span-7">
              <Photo
                name="keys"
                sizes="(min-width: 64rem) 56vw, 100vw"
                className="photo"
                alt="The key rack: five brass hooks under plates numbered 001 to 005. A brass key hangs from the first and a darker iron key from the second, each with a paper tag stamped OPEN in red. From each of the other three hangs an envelope sealed with red wax."
              />
              <figcaption className="photo__note">The key rack, behind the desk.</figcaption>
            </figure>

            <div className="lg:col-span-5">
              {sealed.length > 0 ? (
                <>
                  <p className="label">
                    {sealed.length > 1 ? `Hooks ${sealed[0]} to ${sealed[sealed.length - 1]}` : `Hook ${sealed[0]}`}
                  </p>
                  <p className="display display--3 mt-4">Under wax until they are finished.</p>
                </>
              ) : null}

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

      {/* ------------------------------------------------------ the doors -- */}
      <section className="band" aria-labelledby="close-title">
        <div className="wrap grid items-center gap-x-12 gap-y-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="label">
              {OPEN_ROOMS.length === 1 ? 'File' : 'Files'} {listed(OPEN_ROOMS.map((room) => room.number))}
            </p>
            <h2 id="close-title" className="display display--2 mt-5">
              {doorsOpen(OPEN_ROOMS.length)} Solve the <em>mystery.</em>
            </h2>
            <p className="mt-6 text-ink-2">Each is a different kind of room. Take the one you like the look of.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn--ghost">
                Write to us
              </Link>
            </div>
          </div>

          {/* Each door is the way into its room. The words under it say which. */}
          <div className="doors lg:col-span-8">
            {pictured.map(({ room, pictures }) => (
              <a key={room.slug} href={room.href} className="doorway" data-testid={`door-${room.slug}`}>
                <Photo name={pictures.door} sizes="(min-width: 64rem) 30vw, 50vw" alt={pictures.doorAlt} />
                <span className="doorway__note">
                  <span>
                    <span className="doorway__n">Room {room.number}</span>
                    {room.title}
                  </span>
                  <Arrow />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
