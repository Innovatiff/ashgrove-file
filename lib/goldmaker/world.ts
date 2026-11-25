import type { CellarContent, CellarPlayer, LockDef, Note, PaperDef, ThingDef, ToolDef, ViewDef } from '@/lib/goldmaker/shape';

/**
 * The cellar as one visitor finds it: what was there when they walked in,
 * with everything they have since found, opened or changed laid over it.
 *
 * Both halves come from the server. What was there at the start is one
 * document every visitor reads. What has changed is in the visitor's own
 * file, put there by the function as the consequence of something they did.
 * Nothing here decides what happens: it only puts the two together.
 */
export interface World {
  /** Views by id. */
  views: Map<string, ViewDef>;
  /** Every thing that exists for this visitor, in the order it should be listed. */
  things: ThingDef[];
  /** Tools: what they started with, then what they have picked up. */
  tools: ToolDef[];
  /** What every tool is called, including one that has since been left behind. */
  toolNames: Map<string, string>;
  /** Papers that can be read, in the order they were come by. */
  papers: PaperDef[];
  locks: Map<string, LockDef>;
  /** The order read on being shut in. */
  order: CellarContent['order'];
  /** The view a visitor starts in. */
  start: string;
}

const FLAT = /^[a-z0-9-]+$/;

/** What is set in a visitor's file, as a plain set of flags. */
export function flagsOf(player: CellarPlayer | null): Set<string> {
  return new Set(Object.keys(player?.flags ?? {}).filter((flag) => FLAT.test(flag)));
}

export function buildWorld(content: CellarContent, player: CellarPlayer | null): World {
  const views = new Map(content.views.map((view) => [view.id, view]));
  for (const view of Object.values(player?.views ?? {})) views.set(view.id, view);

  // A thing gained with the id of one that was already there takes its place.
  const changed = player?.things ?? {};
  const things = content.things.map((thing) => changed[thing.id] ?? thing);
  const known = new Set(content.things.map((thing) => thing.id));
  const added = Object.values(changed)
    .filter((thing) => !known.has(thing.id))
    .sort((a, b) => a.view.localeCompare(b.view) || a.rect.x - b.rect.x);

  const carried = Object.values(player?.tools ?? {}).sort((a, b) => a.name.localeCompare(b.name));
  const tools = [...content.tools, ...carried];
  const papers = [...content.papers, ...Object.values(player?.papers ?? {}).sort((a, b) => a.title.localeCompare(b.title))];

  return {
    views,
    things: [...things, ...added].filter((thing) => views.has(thing.view)),
    tools,
    toolNames: new Map([...Object.values(player?.left ?? {}), ...tools].map((tool) => [tool.id, tool.name])),
    papers,
    locks: new Map(content.locks.map((lock) => [lock.id, lock])),
    order: content.order,
    start: content.start,
  };
}

/** What has been written down about one thing, in the order it happened. */
export function notesAbout(player: CellarPlayer | null, thing: string): Note[] {
  return Object.values(player?.notes ?? {})
    .filter((note) => note.target === thing)
    .sort((a, b) => a.n - b.n);
}

/** Every note, oldest first. */
export function allNotes(player: CellarPlayer | null): Note[] {
  return Object.values(player?.notes ?? {}).sort((a, b) => a.n - b.n);
}

/** True once the lock on a thing no longer needs setting. */
export function lockIsOpen(player: CellarPlayer | null, lock: string): boolean {
  return `${lock}-open` in (player?.flags ?? {});
}

/** Marks as a tally: IIII II. Nothing at all when there are none. */
export function tally(marks: number): string {
  const count = Math.max(0, Math.floor(marks));
  const fives = Math.floor(count / 5);
  const rest = count % 5;
  return [...Array<string>(fives).fill('IIIII'), ...(rest > 0 ? ['I'.repeat(rest)] : [])].join(' ');
}
