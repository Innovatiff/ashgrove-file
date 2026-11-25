'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Captain } from '@/components/goldmaker/Captain';
import { useCellar } from '@/components/goldmaker/CellarProvider';
import { Ending } from '@/components/goldmaker/Ending';
import { Paper } from '@/components/goldmaker/Paper';
import { Photo } from '@/components/goldmaker/Photo';
import { Scene } from '@/components/goldmaker/Scene';
import { Sheet } from '@/components/goldmaker/Sheet';
import { type Happened, ThingPanel } from '@/components/goldmaker/ThingPanel';
import { wake } from '@/lib/goldmaker/api';
import { BASE_ROUTE } from '@/lib/goldmaker/shape';
import { allNotes, tally } from '@/lib/goldmaker/world';

/** How long the page waits for a file to turn up before it sends a visitor back to the door. */
const GRACE_MS = 1500;

/** The order places are listed in. Anything else follows, as it was found. */
const ROUTE = ['cellar', 'door', 'jars', 'passage', 'water', 'lane'];

type Open = { sheet: 'order' | 'papers' | 'notes' | 'captain' | 'photo' } | { sheet: 'paper'; paper: string } | null;

function Waiting({ children, testId }: { children: React.ReactNode; testId: string }) {
  return (
    <div className="wrap flex flex-1 flex-col justify-center py-24" role="status" data-testid={testId}>
      {children}
    </div>
  );
}

/**
 * The room itself: where the visitor is standing, what they are looking at,
 * what they carry, and the captain at the hatch.
 *
 * Nothing here decides anything. Where things are and what they look like
 * come from Firestore. What happens when a tool is tried, whether a lock
 * opens and whether the report is right are answered by the function. This
 * component only remembers which way the visitor is facing.
 */
export function Cellar() {
  const { standing, player, world } = useCellar();
  const router = useRouter();

  const [at, setAt] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hinted, setHinted] = useState<string | null>(null);
  const [happened, setHappened] = useState<Record<string, Happened>>({});
  const [open, setOpen] = useState<Open>(null);
  const [orderRead, setOrderRead] = useState(false);
  const [lookingRound, setLookingRound] = useState(false);
  // Places this visitor has walked to since the page was opened.
  const [walked, setWalked] = useState<ReadonlySet<string>>(() => new Set());
  const top = useRef<HTMLDivElement>(null);

  // Somebody with no file has not been shut in. Send them to the door, but
  // not at once: the file can arrive a moment after the page does.
  useEffect(() => {
    if (standing !== 'outside') return;
    const timer = window.setTimeout(() => router.replace(BASE_ROUTE), GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [standing, router]);

  // Wake the function before the first thing is tried.
  useEffect(() => {
    if (standing === 'inside') wake();
  }, [standing]);

  const viewId = at && world?.views.has(at) ? at : (world?.start ?? null);
  const view = viewId ? world?.views.get(viewId) : undefined;
  const things = useMemo(() => (world && viewId ? world.things.filter((thing) => thing.view === viewId) : []), [world, viewId]);
  const thing = things.find((candidate) => candidate.id === selected) ?? null;

  // The list of places is a way back, not a map of what is still ahead. A
  // place one step from where the room starts is listed as soon as it exists.
  // Anything further is listed once the visitor has walked there.
  const places = useMemo(() => {
    if (!world) return [];
    const near = (id: string) => {
      const back = world.views.get(id)?.back;
      return !back || !world.views.get(back)?.back;
    };
    const ids = [...world.views.keys()].filter((id) => near(id) || walked.has(id) || id === viewId);
    return ids.sort((a, b) => (ROUTE.indexOf(a) + 1 || 99) - (ROUTE.indexOf(b) + 1 || 99)).map((id) => world.views.get(id)!);
  }, [world, walked, viewId]);

  const arrive = useCallback((next: string | null) => {
    setAt(next);
    if (next) setWalked((current) => (current.has(next) ? current : new Set(current).add(next)));
    setSelected(null);
    top.current?.scrollIntoView({ block: 'start' });
    window.requestAnimationFrame(() => top.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }));
  }, []);

  // Walking somewhere is a step the browser remembers, so its Back button
  // (or a thumb swiped from the edge of a phone) goes back a place, and does
  // not throw the visitor out of the room.
  const go = useCallback(
    (next: string) => {
      window.history.pushState({ cellar: next }, '');
      arrive(next);
    },
    [arrive],
  );
  useEffect(() => {
    const back = (event: PopStateEvent) => arrive((event.state as { cellar?: string } | null)?.cellar ?? null);
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, [arrive]);

  // A visitor comes here from the foot of the front page, where the warrant
  // is. While the cellar is on its way this page is short, and a browser that
  // holds what is on screen in place as a page grows would leave them looking
  // at the foot of this one. The room is entered at the top.
  const here = standing === 'inside' && Boolean(player && world && view);
  useEffect(() => {
    if (here) window.scrollTo(0, 0);
  }, [here]);

  const note = useCallback((id: string, what: Happened) => setHappened((current) => ({ ...current, [id]: what })), []);

  if (standing === 'lost') {
    return (
      <Waiting testId="cellar-lost">
        <h1 className="title title--2">The cellar cannot be reached</h1>
        <p className="mt-4">Check your connection, then try again.</p>
        <p className="mt-6">
          <button type="button" className="btn" onClick={() => window.location.reload()}>
            Try again
          </button>
        </p>
      </Waiting>
    );
  }
  if (standing === 'outside') {
    return (
      <Waiting testId="cellar-outside">
        <h1 className="title title--2">You have not been shut in yet</h1>
        <p className="mt-4">
          The cellar is behind a warrant.{' '}
          <Link href={BASE_ROUTE} className="link">
            Go to the door
          </Link>
          .
        </p>
      </Waiting>
    );
  }
  if (standing === 'finding' || !player || !world || !view) {
    return (
      <Waiting testId="cellar-finding">
        <p className="title title--2">The captain is finding his keys</p>
      </Waiting>
    );
  }

  if (player.closedAt && !lookingRound) {
    return <Ending player={player} onLookRound={() => setLookingRound(true)} />;
  }

  // The order is read on arriving, until something has been done.
  const fresh = (player.noteCount ?? 0) === 0 && Object.keys(player.flags ?? {}).length === 0;
  const sheet: Open = open ?? (fresh && !orderRead ? { sheet: 'order' } : null);
  const close = () => {
    setOpen(null);
    setOrderRead(true);
  };

  const notes = allNotes(player);
  const back = view.back ? world.views.get(view.back) : undefined;
  const paperOpen = sheet?.sheet === 'paper' ? world.papers.find((paper) => paper.id === sheet.paper) : undefined;
  const nameOf = (id: string) => world.things.find((candidate) => candidate.id === id)?.name ?? id;
  const toolName = (id: string) => world.toolNames.get(id) ?? id;

  return (
    <div ref={top} data-testid="cellar" data-view={view.id}>
      <div className="wrap flex flex-wrap items-end justify-between gap-x-8 gap-y-3 py-4">
        <div>
          <h1 className="title title--2" tabIndex={-1} data-testid="view-name">
            {view.name}
          </h1>
          <p className="mute mt-1 max-w-[70ch]">{view.lede}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Your papers, your notes and the captain">
          {player.closedAt ? (
            <button type="button" className="btn btn--small" onClick={() => setLookingRound(false)} data-testid="open-ending">
              The account
            </button>
          ) : null}
          <button type="button" className="btn btn--small" onClick={() => setOpen({ sheet: 'papers' })} data-testid="open-papers">
            Papers
          </button>
          <button type="button" className="btn btn--small" onClick={() => setOpen({ sheet: 'notes' })} data-testid="open-notes">
            Notes{notes.length > 0 ? ` (${notes.length})` : ''}
          </button>
          <button type="button" className="btn btn--small" onClick={() => setOpen({ sheet: 'captain' })} data-testid="open-captain">
            The captain
            {player.marks > 0 ? (
              <span className="ml-1" data-testid="marks-count">
                <span aria-hidden="true">{tally(player.marks)}</span>
                <span className="hidden-text">
                  , {player.marks} {player.marks === 1 ? 'mark' : 'marks'} against you
                </span>
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {places.length > 1 ? (
        <nav className="wrap pb-3" aria-label="Places">
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {places.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  className={place.id === view.id ? 'brass min-h-[32px]' : 'link min-h-[32px]'}
                  aria-current={place.id === view.id ? 'location' : undefined}
                  onClick={() => go(place.id)}
                  data-testid={`place-${place.id}`}
                >
                  {place.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <Scene view={view} things={things} selected={thing?.id ?? null} hinted={thing ? null : hinted} onSelect={setSelected} />

      <div className="wrap bench">
        <div>
          {thing ? (
            <ThingPanel
              key={thing.id}
              thing={thing}
              world={world}
              player={player}
              happened={happened[thing.id] ?? null}
              onHappened={note}
              onGo={go}
              onRead={(paper) => setOpen({ sheet: 'paper', paper })}
              onAsk={() => setOpen({ sheet: 'captain' })}
              onLook={() => setOpen({ sheet: 'photo' })}
              onBack={() => setSelected(null)}
            />
          ) : (
            <section aria-labelledby="here" data-testid="here">
              <h2 id="here" className="label">
                What is here
              </h2>
              <ul className="list places mt-2">
                {things.map((candidate) => (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(candidate.id)}
                      onFocus={() => setHinted(candidate.id)}
                      onBlur={() => setHinted(null)}
                      onMouseEnter={() => setHinted(candidate.id)}
                      onMouseLeave={() => setHinted(null)}
                      data-testid={`here-${candidate.id}`}
                    >
                      {candidate.name}
                    </button>
                  </li>
                ))}
              </ul>
              {back ? (
                <p className="mt-5">
                  <button type="button" className="btn btn--small" onClick={() => go(back.id)} data-testid="go-back">
                    Back: {back.name.toLowerCase()}
                  </button>
                </p>
              ) : null}
            </section>
          )}
        </div>

        <aside aria-labelledby="carrying" data-testid="pouch">
          <h2 id="carrying" className="label">
            You are carrying
          </h2>
          <ul className="list mt-2">
            {world.tools.map((tool) => (
              <li key={tool.id} className="px-1 py-2.5" data-testid={`tool-${tool.id}`}>
                <p className="brass">{tool.name}</p>
                <p className="mute text-[1rem]">{tool.text}</p>
              </li>
            ))}
          </ul>
          <p className="mute mt-3 text-[1rem]">To use one, look at a thing and press the tool under “Try on it”.</p>
        </aside>
      </div>

      <Sheet open={sheet?.sheet === 'order'} onClose={close} title={world.order.title} vellum testId="sheet-order">
        <div className="prose">
          {world.order.lines.map((line, index) => (
            <p key={line} className={index === 0 ? 'dropcap' : undefined}>
              {line}
            </p>
          ))}
          <p className="rubric text-[1.2rem]">{world.order.foot}</p>
        </div>
        <p className="mt-7">
          <button type="button" className="btn" onClick={close} data-testid="order-begin">
            Hear the bar drop
          </button>
        </p>
      </Sheet>

      <Sheet open={sheet?.sheet === 'paper'} onClose={close} title={paperOpen?.title ?? ''} vellum testId="sheet-paper">
        {paperOpen ? <Paper paper={paperOpen} /> : null}
      </Sheet>

      <Sheet open={sheet?.sheet === 'photo' && Boolean(thing?.picture)} onClose={close} title={thing?.name ?? ''} wide testId="sheet-photo">
        {thing?.picture ? (
          <figure>
            <Photo picture={thing.picture} sizes="(min-width: 1204px) 1180px, 100vw" className="sheet__photo" />
            <figcaption className="px-5 py-3 text-[1rem]">{thing.picture.alt}</figcaption>
          </figure>
        ) : null}
      </Sheet>

      <Sheet open={sheet?.sheet === 'papers'} onClose={close} title="Papers" testId="sheet-papers">
        <p className="mute">Everything in the cellar that can be read, and anything you have found since.</p>
        <ul className="list mt-4">
          {world.papers.map((paper) => (
            <li key={paper.id}>
              <button type="button" onClick={() => setOpen({ sheet: 'paper', paper: paper.id })} data-testid={`papers-${paper.id}`}>
                <span>{paper.title}</span>
                <span className="mute text-[1rem]">Read</span>
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={sheet?.sheet === 'notes'} onClose={close} title="Notes" testId="sheet-notes">
        {notes.length === 0 ? (
          <p className="mute">Nothing yet. Whatever comes of trying a tool on a thing is written here.</p>
        ) : (
          <ol className="noted" data-testid="notes">
            {notes.map((entry) => (
              <li key={entry.n}>
                <p className="label">
                  {nameOf(entry.target)} · {toolName(entry.tool)}
                </p>
                <p className="mt-1">{entry.text}</p>
              </li>
            ))}
          </ol>
        )}
      </Sheet>

      <Sheet open={sheet?.sheet === 'captain'} onClose={close} title="The captain, at the hatch" testId="sheet-captain">
        <Captain player={player} />
      </Sheet>
    </div>
  );
}
