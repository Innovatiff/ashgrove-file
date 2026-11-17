import Link from 'next/link';
import { Arrow } from '@/components/site/Arrow';
import { Corridor } from '@/components/site/Corridor';
import { KeyRack } from '@/components/site/KeyRack';
import { LobbyClock } from '@/components/site/LobbyClock';
import { Padlock } from '@/components/site/Padlock';
import { PracticeBox } from '@/components/site/PracticeBox';
import { ReceptionDesk } from '@/components/site/ReceptionDesk';
import { RoomPlate, SealedPlate } from '@/components/site/RoomPlate';
import { TodayBoard } from '@/components/site/TodayBoard';
import { SITE } from '@/lib/site/brand';
import { ASHGROVE, CATALOGUE, OPEN_ROOMS, SEALED_ROOMS } from '@/lib/site/catalogue';
import { CLOCK_FAST_MINUTES, LET_OUT_BY_THE_CLOCK } from '@/lib/site/practice';

// The home page is a walk through a place, in the order a visitor would walk
// it: in at reception, past the desk and the box that sits on it, the notices
// on the wall, the lockers, and then the corridor the rooms open off.
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

export default function HomePage() {
  return (
    <>
      {/* ----------------------------------------------------- reception -- */}
      <section className="reception wall" aria-labelledby="hero-title">
        <div className="wrap grid items-start gap-x-12 gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="label">{SITE.tagline}</p>
            <h1 id="hero-title" className="display display--1 mt-6">
              Come in. Solve the <em>mystery.</em>
            </h1>
            <p className="lede mt-8">
              You have just walked into {SITE.name}. Down the corridor are locked rooms, and in each one something
              happened that nobody has explained. Read what was left behind. Work out what really happened. Prove it.
            </p>

            <ul className="keytags mt-7" aria-label="Before you ask">
              <li className="keytag">Played in your browser</li>
              <li className="keytag">Nothing to install</li>
              <li className="keytag">No account</li>
              <li className="keytag">File {ASHGROVE.number} is free</li>
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
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

          {/* What hangs on the wall behind the desk. */}
          <div className="reception__wall lg:col-span-5">
            <div className="reception__clock">
              <LobbyClock />
            </div>
            <div className="reception__board">
              <TodayBoard open={OPEN_ROOMS} sealed={SEALED_ROOMS} />
            </div>
            <p className="brass-plate reception__plate">This clock runs {CLOCK_FAST_MINUTES} minutes fast. Leave it.</p>
            <div className="reception__keys">
              <KeyRack rooms={CATALOGUE} />
            </div>
          </div>
        </div>

        <ReceptionDesk />
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
            <ol className="exhibits">
              <li className="exhibit">
                <div className="exhibit__thing">
                  <p className="brass-plate">This clock runs {CLOCK_FAST_MINUTES} minutes fast. Leave it.</p>
                </div>
                <p className="quiet text-[0.9375rem]">Screwed to the wall, under the lobby clock.</p>
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
                <p className="quiet text-[0.9375rem]">The card tied to the box.</p>
              </li>
            </ol>

            <div className="mt-10">
              <PracticeBox href={ASHGROVE.href} enter={`Take key ${ASHGROVE.number}`} />
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- the briefing -- */}
      <section className="band wall" aria-labelledby="briefing-title">
        <div className="wrap split">
          <div className="split__aside">
            <p className="label">The briefing</p>
            <h2 id="briefing-title" className="display display--3 mt-5">
              What you would be told at the door.
            </h2>
            <p className="mt-6">
              <Link href="/how-it-works" className="textlink">
                The longer version
              </Link>
            </p>
          </div>
          <div className="noticeboard">
            <p className="noticeboard__name" aria-hidden="true">
              Notices
            </p>
            <ol className="notes">
              {BRIEFING.map((note, index) => (
                <li key={note.head} className="note">
                  <span className="step__n" aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3 className="display display--4 mt-4">{note.head}</h3>
                  <p className="mt-2 text-ink-2">{note.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- the lockers -- */}
      <section className="band band--ink" aria-labelledby="lockers-title">
        <div className="wrap">
          <div className="grid items-end gap-x-12 gap-y-6 md:grid-cols-12">
            <div className="md:col-span-7">
              <p className="label">The lockers</p>
              <h2 id="lockers-title" className="display display--2 mt-5">
                Leave these here. You will not need them.
              </h2>
            </div>
            <p className="quiet md:col-span-5">Four things no room in this building will ask you for, whatever is behind its door.</p>
          </div>

          <ul className="lockers mt-10 md:mt-14">
            {LOCKERS.map((locker, index) => (
              <li key={locker.leave} className="locker">
                <div className="locker__vents" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <p className="locker__number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <Padlock className="locker__lock" />
                <p className="label mt-8">Leave here: {locker.leave}</p>
                <h3 className="display display--3 mt-3">{locker.head}</h3>
                <p className="mt-3 text-ink-2">{locker.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------- the corridor -- */}
      <section id="rooms" className="band wall" aria-labelledby="rooms-title">
        <div className="wrap">
          <div className="grid items-end gap-x-12 gap-y-6 md:grid-cols-12">
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

          <Corridor />

          <div className="mt-10 grid gap-6 md:mt-14">
            {OPEN_ROOMS.map((room) => (
              <RoomPlate key={room.slug} room={room} />
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
              {SEALED_ROOMS.map((room) => (
                <SealedPlate key={room.number} room={room} />
              ))}
            </div>
            <div className="flex flex-col justify-center lg:col-span-4 lg:pl-4">
              <p className="stamp self-start">A dare</p>
              <p className="display display--3 mt-5">
                File {ASHGROVE.number} says most detectives close the tab at Room III.
              </p>
              <p className="mt-4 text-ink-2">It is on the front page, where you can read it before you go in. Go in anyway.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- the door -- */}
      <section className="band" aria-labelledby="close-title">
        <div className="wrap grid items-end gap-x-12 gap-y-8 md:grid-cols-12">
          <div className="md:col-span-8">
            <p className="label">
              File {ASHGROVE.number} · {ASHGROVE.title}
            </p>
            <h2 id="close-title" className="display display--2 mt-5">
              The first door is open. Solve the <em>mystery.</em>
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
