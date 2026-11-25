/**
 * The Gold-Maker: what happens in the cellar.
 *
 * Every change to a visitor's file is made by one of the five functions
 * below, and by nothing else. Each takes the visitor's file as it stands,
 * changes it in place and says what the visitor is to be told. The Cloud
 * Function (./handler.ts) only reads the file, calls one of these inside a
 * transaction and writes the file back.
 *
 * Nothing here touches Firebase, so the same code runs in the unit tests,
 * where a whole playthrough is walked from the door to the report.
 */

import {
  type CellarPlayer,
  HINT_MARKS,
  HINT_TIERS,
  type HintResult,
  type HintTopic,
  LOCK_LIMIT,
  lockValue,
  MISSED_LOCK_MARKS,
  MISSED_REPORT_MARKS,
  type Note,
  openFlag,
  rankFor,
  type Reaction,
  REPORT_LIMIT,
  type ReportResult,
  type Reveal,
  type Secrets,
  type SetResult,
  TRY_LIMIT,
  type TryResult,
  WINDOW_MS,
} from './shape';

/** Why the cellar refused. `code` is one of the callable error codes. */
export class Refusal extends Error {
  constructor(
    readonly code: 'invalid-argument' | 'failed-precondition' | 'not-found' | 'resource-exhausted',
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'Refusal';
  }
}

/** The time, in whatever form the caller keeps it. */
export interface Clock<T> {
  now: T;
  millis(stamp: T): number;
}

/** Turns a setting or an answer into the form it is stored in. */
export type Hasher = (text: string) => string;

const all = (flags: Record<string, unknown>, wanted: readonly string[] | undefined) =>
  (wanted ?? []).every((flag) => flag in flags);
const any = (flags: Record<string, unknown>, wanted: readonly string[] | undefined) =>
  (wanted ?? []).some((flag) => flag in flags);

/** What the captain can be asked about, as things stand. */
export function topicsFor(secrets: Secrets, flags: Record<string, unknown>): Array<{ id: string; label: string }> {
  return secrets.hints.filter((topic) => topicIsOpen(topic, flags)).map(({ id, label }) => ({ id, label }));
}

function topicIsOpen(topic: HintTopic, flags: Record<string, unknown>): boolean {
  return all(flags, topic.when) && !any(flags, topic.until);
}

/** A new file: a visitor who has just been shut in. */
export function enter<T>(secrets: Secrets, name: string, clock: Clock<T>): CellarPlayer<T> {
  return {
    name,
    enteredAt: clock.now,
    flags: {},
    tools: {},
    left: {},
    things: {},
    views: {},
    papers: {},
    notes: {},
    noteCount: 0,
    marks: 0,
    hints: {},
    topics: topicsFor(secrets, {}),
    tries: {},
    report: null,
    misses: 0,
    closedAt: null,
    rank: null,
    account: null,
  };
}

/** Counts one try against a limit. Throws when the window is full. */
function count<T>(player: CellarPlayer<T>, key: string, limit: number, clock: Clock<T>, message: (seconds: number) => string): number {
  const tries = (player.tries ??= {});
  const now = clock.millis(clock.now);
  const previous = tries[key];
  const open = previous !== undefined && now - clock.millis(previous.windowStart) < WINDOW_MS;

  if (open && previous.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((clock.millis(previous.windowStart) + WINDOW_MS - now) / 1000));
    throw new Refusal('resource-exhausted', message(retryAfterSeconds), { retryAfterSeconds });
  }

  tries[key] = open ? { count: previous.count + 1, windowStart: previous.windowStart } : { count: 1, windowStart: clock.now };
  return limit - (tries[key]?.count ?? 0);
}

function setFlags<T>(player: CellarPlayer<T>, flags: readonly string[] | undefined, clock: Clock<T>): void {
  for (const flag of flags ?? []) {
    if (!(flag in player.flags)) player.flags[flag] = clock.now;
  }
}

/** Adds what was gained to the file. Returns the names of anything new. */
function give<T>(player: CellarPlayer<T>, reveal: Reveal | undefined): string[] {
  if (!reveal) return [];
  const gained: string[] = [];
  for (const tool of reveal.tools ?? []) {
    if (!(tool.id in player.tools)) gained.push(tool.name);
    player.tools[tool.id] = tool;
  }
  for (const paper of reveal.papers ?? []) {
    if (!(paper.id in player.papers)) gained.push(paper.title);
    player.papers[paper.id] = paper;
  }
  for (const view of reveal.views ?? []) player.views[view.id] = view;
  for (const thing of reveal.things ?? []) player.things[thing.id] = thing;
  // What is left behind is no longer carried: a key that stays in its lock.
  // It is kept by name, because the notes go on saying what was done with it.
  for (const id of reveal.drop ?? []) {
    const tool = player.tools[id];
    if (!tool) continue;
    (player.left ??= {})[id] = tool;
    delete player.tools[id];
  }
  if (reveal.report) player.report = reveal.report;
  return gained;
}

/** The reaction that fits, if any. The first in the list wins. */
export function reactionFor(secrets: Secrets, flags: Record<string, unknown>, tool: string, target: string): Reaction | null {
  return (
    secrets.reactions.find(
      (reaction) => reaction.tool === tool && reaction.target === target && all(flags, reaction.when) && !any(flags, reaction.unless),
    ) ?? null
  );
}

/** Tries one tool on one thing. */
export function tryTool<T>(secrets: Secrets, player: CellarPlayer<T>, tool: string, target: string, clock: Clock<T>): TryResult {
  if (!secrets.tools.includes(tool) && !(tool in player.tools)) {
    throw new Refusal('failed-precondition', 'You are not carrying that.');
  }
  if (!secrets.things.includes(target) && !(target in player.things)) {
    throw new Refusal('not-found', 'There is no such thing in this cellar.');
  }

  count(player, 'try', TRY_LIMIT, clock, (seconds) => `Slowly. The cellar is not going anywhere. Wait ${seconds} seconds.`);

  const reaction = reactionFor(secrets, player.flags, tool, target);
  if (!reaction) return { text: secrets.defaults[tool] ?? secrets.fallback, noted: false, gained: [] };

  setFlags(player, reaction.set, clock);
  const gained = give(player, reaction.reveal);

  const noted = !reaction.quiet;
  if (noted && !(reaction.id in player.notes)) {
    player.noteCount += 1;
    const note: Note = { tool, target, text: reaction.text, n: player.noteCount };
    player.notes[reaction.id] = note;
  }

  player.topics = topicsFor(secrets, player.flags);
  return { text: reaction.text, noted, gained };
}

/**
 * Turns the rings of one lock to a setting. A setting that does not open it
 * is marked: a lock is opened by knowing its setting, and a visitor who only
 * turns the rings until it gives has not learned what it was built to ask.
 */
export function setLock<T>(
  secrets: Secrets,
  player: CellarPlayer<T>,
  lockId: string,
  faces: readonly string[],
  clock: Clock<T>,
  hash: Hasher,
): SetResult {
  const lock = secrets.locks.find((candidate) => candidate.id === lockId);
  if (!lock) throw new Refusal('not-found', 'There is no such lock in this cellar.');
  if (!all(player.flags, lock.when)) throw new Refusal('failed-precondition', 'You cannot reach that yet.');

  const flags = lock.set ?? [openFlag(lock.id)];
  if (flags.every((flag) => flag in player.flags)) return { open: true, triesLeft: LOCK_LIMIT, text: lock.text, gained: [] };

  const triesLeft = count(
    player,
    `lock-${lock.id}`,
    LOCK_LIMIT,
    clock,
    (seconds) => `Ten settings in a minute is not thought, it is rattling. Wait ${seconds} seconds.`,
  );

  const candidate = hash(lockValue(faces));
  if (!lock.hashes.includes(candidate)) {
    player.marks += MISSED_LOCK_MARKS;
    return { open: false, triesLeft, marksAdded: MISSED_LOCK_MARKS, marks: player.marks };
  }

  setFlags(player, flags, clock);
  const gained = give(player, lock.reveal);
  player.topics = topicsFor(secrets, player.flags);
  return { open: true, triesLeft, text: lock.text, gained };
}

/** Asks the captain. Tiers open in order, and each is written against the visitor's name once. */
export function takeHint<T>(secrets: Secrets, player: CellarPlayer<T>, topicId: string, tier: number): HintResult {
  const topic = secrets.hints.find((candidate) => candidate.id === topicId);
  if (!topic) throw new Refusal('not-found', 'The captain has nothing to say about that.');
  if (!Number.isInteger(tier) || tier < 1 || tier > HINT_TIERS) throw new Refusal('invalid-argument', 'No such hint.');

  const taken = player.hints[topic.id]?.said ?? [];

  // Already paid for: said again, free.
  const again = taken[tier - 1];
  if (again !== undefined) return { tier, text: again, marksAdded: 0, marks: player.marks };

  if (!topicIsOpen(topic, player.flags)) {
    throw new Refusal('failed-precondition', 'There is nothing left to ask about that.');
  }
  if (tier !== taken.length + 1) {
    throw new Refusal('failed-precondition', 'The captain answers in order. Ask the one before it first.');
  }

  const text = topic.tiers[tier - 1];
  if (typeof text !== 'string' || text.length === 0) throw new Refusal('not-found', 'The captain has nothing to say about that.');

  const marksAdded = HINT_MARKS[tier - 1] ?? 0;
  player.hints[topic.id] = { label: topic.label, said: [...taken, text] };
  player.marks += marksAdded;
  return { tier, text, marksAdded, marks: player.marks };
}

/**
 * The report. Each part must have been proved before it is weighed at all: a
 * part that has not been proved is sent back without a word about whether it
 * is right, and costs nothing. A part that is proved and wrong is marked.
 */
export function report<T>(
  secrets: Secrets,
  player: CellarPlayer<T>,
  answers: Record<string, string>,
  clock: Clock<T>,
  hash: Hasher,
): ReportResult & { closedNow: boolean } {
  const rules = secrets.report;

  if (player.closedAt) return { closed: true, closedNow: false, rank: player.rank ?? undefined, marks: player.marks };
  if (!all(player.flags, rules.when)) throw new Refusal('failed-precondition', rules.early);

  const questions = Object.keys(rules.answers);
  for (const question of questions) {
    const given = answers[question];
    if (typeof given !== 'string' || given.length === 0 || given.length > 40) {
      throw new Refusal('invalid-argument', 'Answer all of it. He will ask all of it.');
    }
  }

  count(player, 'report', REPORT_LIMIT, clock, (seconds) => `The captain is still writing. Wait ${seconds} seconds.`);

  const unproven = questions.filter((question) => !all(player.flags, rules.needs[question]));
  if (unproven.length > 0) {
    return {
      closed: false,
      closedNow: false,
      failed: unproven,
      lines: unproven.map((question) => rules.unproven[question] ?? ''),
      marked: false,
      marks: player.marks,
    };
  }

  const wrong = questions.filter((question) => hash(answers[question] ?? '') !== rules.answers[question]);
  if (wrong.length > 0) {
    player.misses += 1;
    player.marks += MISSED_REPORT_MARKS;
    return {
      closed: false,
      closedNow: false,
      failed: wrong,
      lines: wrong.map((question) => rules.wrong[question] ?? ''),
      marked: true,
      marks: player.marks,
    };
  }

  player.closedAt = clock.now;
  player.rank = rankFor(player.marks);
  player.account = rules.closed;
  setFlags(player, ['closed'], clock);
  player.topics = topicsFor(secrets, player.flags);
  return { closed: true, closedNow: true, rank: player.rank, marks: player.marks };
}
