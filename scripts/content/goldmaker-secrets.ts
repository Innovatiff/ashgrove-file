/**
 * Reading the sealed half of File 002, The Gold-Maker.
 *
 * It lives in answers.json beside the codes of The Ashgrove File, under the
 * key "goldmaker", and so it is sealed and opened with the same file. It
 * holds what happens when a tool is tried on a thing, the settings of the two
 * locks, the hints, the report and the closing account, and the shortest
 * honest way through the room.
 *
 * The seed script, the bundle check and the tests all read it through here,
 * so that they agree about what is in it.
 */

import { type Clock, enter, Refusal, report, setLock, takeHint, tryTool } from '../../functions/src/goldmaker/engine';
import { hashExact } from '../../functions/src/goldmaker/hash';
import {
  type CellarContent,
  HINT_TIERS,
  ID,
  lockValue,
  openFlag,
  type PaperDef,
  type Picture,
  type Reaction,
  type ReportDef,
  type Reveal,
  type Secrets,
  type ThingDef,
  type ToolDef,
  type ViewDef,
} from '../../functions/src/goldmaker/shape';
import { type CellarSource, type PictureSource, type ThingSource, type ViewSource, withSize } from './goldmaker';

/** The key in answers.json. */
export const GOLDMAKER_KEY = 'goldmaker';

/** One step of the way through: what a visitor does. */
export type Step =
  | ['try', string, string]
  | ['set', string, string[]]
  | ['hint', string, number]
  | ['report', Record<string, string>];

type RevealSource = Omit<Reveal, 'things' | 'views'> & { things?: ThingSource[]; views?: ViewSource[] };
type ReactionSource = Omit<Reaction, 'reveal'> & { reveal?: RevealSource };

interface LockSource {
  id: string;
  answer: string[];
  when?: string[];
  text: string;
  set?: string[];
  reveal?: RevealSource;
}

interface RawGoldmaker {
  defaults: Record<string, string>;
  fallback: string;
  reactions: ReactionSource[];
  locks: LockSource[];
  hints: Secrets['hints'];
  report: Omit<Secrets['report'], 'answers'> & { answers: Record<string, string> };
  walkthrough: Step[];
}

/** A sealed line shorter than this is too ordinary to search for. */
export const SEARCHABLE = 12;

/**
 * What is in the cellar from the start, as lines to search a bundle for. It
 * is public, but it reaches a browser through Firestore and only once a
 * visitor has a file, so none of it should be in the pages.
 */
export function cellarLines(source: CellarSource): Array<{ what: string; text: string }> {
  const lines: Array<{ what: string; text: string }> = [];
  for (const view of source.views) {
    lines.push({ what: `the cellar: view "${view.id}"`, text: view.lede });
    lines.push({ what: `the cellar: picture of "${view.id}"`, text: view.picture.alt });
  }
  for (const thing of source.things) {
    lines.push({ what: `the cellar: thing "${thing.id}"`, text: thing.text });
    if (thing.picture) lines.push({ what: `the cellar: picture of "${thing.id}"`, text: thing.picture.alt });
  }
  for (const tool of source.tools) lines.push({ what: `the cellar: tool "${tool.id}"`, text: tool.text });
  for (const paper of source.papers) {
    if (paper.kind === 'text') for (const paragraph of paper.body.split(/\n+/)) lines.push({ what: `the cellar: paper "${paper.id}"`, text: paragraph });
    if (paper.kind === 'chart') for (const row of paper.rows) lines.push({ what: `the cellar: the chart, ${row.metal}`, text: row.known });
    if (paper.kind === 'book') {
      for (const leaf of paper.leaves) lines.push({ what: `the cellar: the book, ${leaf.name}`, text: leaf.verse ?? leaf.gone ?? '' });
      lines.push({ what: 'the cellar: the book, its last page', text: paper.colophon });
    }
  }
  for (const line of source.order.lines) lines.push({ what: 'the cellar: the order', text: line });
  return lines.filter((line) => line.text.trim().length >= 24);
}

export interface GoldmakerFile {
  /** What the seed writes to games/goldmaker/content/cellar. */
  content: CellarContent;
  /** What the seed writes to games/goldmaker/secrets/engine. */
  secrets: Secrets;
  walkthrough: Step[];
  /** Everything in it that must never reach a browser unasked, with what it is. */
  strings: Array<{ what: string; text: string }>;
  problems: string[];
}

type Sizes = Record<string, Omit<Picture, 'alt'>>;

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isList = (value: unknown): value is unknown[] => Array.isArray(value);

/** Firestore refuses a field that is undefined. This leaves them out. */
function compact<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Reads the public half (scripts/content/goldmaker.ts) and the sealed half
 * (the parsed "goldmaker" entry of answers.json) together, because each has
 * to fit the other. Problems are collected, not thrown.
 */
export function readGoldmaker(source: CellarSource, raw: unknown, sizes: Sizes): GoldmakerFile {
  const problems: string[] = [];
  const strings: Array<{ what: string; text: string }> = [];

  const picture = (where: string, from: PictureSource) => withSize(from, sizes, problems, where);
  const view = (from: ViewSource): ViewDef => ({ ...from, picture: picture(`view ${from.id}`, from.picture) });
  const thing = (from: ThingSource): ThingDef => {
    const { picture: pictureSource, ...rest } = from;
    return pictureSource ? { ...rest, picture: picture(`thing ${from.id}`, pictureSource) } : rest;
  };

  // ------------------------------------------------------- the public half ---

  const content: CellarContent = compact({
    order: source.order,
    start: source.start,
    views: source.views.map(view),
    things: source.things.map(thing),
    tools: source.tools,
    papers: source.papers,
    locks: source.locks,
  });

  const viewIds = new Set(content.views.map((entry) => entry.id));
  const thingIds = new Set<string>();
  const toolIds = new Set(content.tools.map((tool) => tool.id));
  const paperIds = new Set(content.papers.map((paper) => paper.id));
  const lockIds = new Set(content.locks.map((lock) => lock.id));

  const checkId = (where: string, id: unknown) => {
    if (typeof id !== 'string' || !ID.test(id)) problems.push(`${where}: "${String(id)}" is not an id (lowercase letters, digits and hyphens).`);
  };
  const checkThing = (where: string, entry: ThingDef, views: Set<string>, papers: Set<string>) => {
    checkId(where, entry.id);
    if (!views.has(entry.view)) problems.push(`${where}: it is in view "${entry.view}", which does not exist.`);
    const { x, y, w, h } = entry.rect;
    if ([x, y, w, h].some((n) => typeof n !== 'number') || x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > 100.01 || y + h > 100.01) {
      problems.push(`${where}: its place in the picture runs off the picture.`);
    }
    if (!isText(entry.name) || !isText(entry.text)) problems.push(`${where}: it needs a name and something to see.`);
    if (entry.paper && !papers.has(entry.paper)) problems.push(`${where}: paper "${entry.paper}" does not exist.`);
    if (entry.lock && !lockIds.has(entry.lock)) problems.push(`${where}: lock "${entry.lock}" does not exist.`);
  };

  if (!viewIds.has(content.start)) problems.push(`The room starts in view "${content.start}", which does not exist.`);
  for (const entry of content.things) {
    if (thingIds.has(entry.id)) problems.push(`thing ${entry.id}: there are two of them.`);
    thingIds.add(entry.id);
    checkThing(`thing ${entry.id}`, entry, viewIds, paperIds);
  }
  for (const entry of content.things) {
    if (entry.to && !viewIds.has(entry.to)) problems.push(`thing ${entry.id}: it leads to "${entry.to}", which is not there at the start.`);
  }
  for (const lock of content.locks) {
    if (!content.things.some((entry) => entry.lock === lock.id)) problems.push(`lock ${lock.id}: nothing in the room carries it.`);
  }

  // ------------------------------------------------------- the sealed half ---

  const empty: Secrets = {
    tools: [...toolIds],
    things: [...thingIds],
    defaults: {},
    fallback: '',
    reactions: [],
    locks: [],
    hints: [],
    report: { when: [], early: '', answers: {}, needs: {}, unproven: {}, wrong: {}, closed: { title: '', body: '' } },
  };

  if (!isObject(raw)) {
    problems.push(`The answers file has no "${GOLDMAKER_KEY}" entry, so nothing in the cellar could ever happen.`);
    return { content, secrets: empty, walkthrough: [], strings, problems };
  }
  const sealed = raw as unknown as RawGoldmaker;
  if (!isList(sealed.reactions) || !isList(sealed.locks) || !isList(sealed.hints) || !isObject(sealed.report) || !isObject(sealed.defaults)) {
    problems.push(`${GOLDMAKER_KEY}: it needs "defaults", "reactions", "locks", "hints" and "report".`);
    return { content, secrets: empty, walkthrough: [], strings, problems };
  }

  // Everything that can ever come to exist, for checking what refers to what.
  const everyTool = new Set(toolIds);
  const everyThing = new Set(thingIds);
  const everyView = new Set(viewIds);
  const everyPaper = new Set(paperIds);
  const setFlags = new Set<string>(['closed']);
  const usedFlags: Array<{ where: string; flag: string }> = [];

  const reveals: Array<{ where: string; reveal: RevealSource }> = [];
  for (const reaction of sealed.reactions) if (reaction.reveal) reveals.push({ where: `reaction ${reaction.id}`, reveal: reaction.reveal });
  for (const lock of sealed.locks) if (lock.reveal) reveals.push({ where: `lock ${lock.id}`, reveal: lock.reveal });
  for (const { reveal } of reveals) {
    for (const tool of reveal.tools ?? []) everyTool.add(tool.id);
    for (const entry of reveal.things ?? []) everyThing.add(entry.id);
    for (const entry of reveal.views ?? []) everyView.add(entry.id);
    for (const paper of reveal.papers ?? []) everyPaper.add(paper.id);
  }

  let reportDef: ReportDef | undefined;
  const resolve = (where: string, reveal: RevealSource | undefined): Reveal | undefined => {
    if (!reveal) return undefined;
    const tools: ToolDef[] = reveal.tools ?? [];
    const papers: PaperDef[] = reveal.papers ?? [];
    const things = (reveal.things ?? []).map(thing);
    const views = (reveal.views ?? []).map(view);
    const drop = reveal.drop ?? [];

    // Only what was found can be left behind: what a visitor walked in with is not in their file.
    for (const tool of drop) {
      if (toolIds.has(tool)) problems.push(`${where}: "${tool}" is carried from the start, so it cannot be left behind.`);
      else if (!everyTool.has(tool)) problems.push(`${where}: it leaves behind tool "${tool}", which never exists.`);
    }
    for (const tool of tools) {
      checkId(`${where}, tool`, tool.id);
      strings.push({ what: `a tool found later (${tool.id})`, text: tool.text });
    }
    for (const paper of papers) {
      checkId(`${where}, paper`, paper.id);
      if (paper.kind === 'text') for (const paragraph of paper.body.split(/\n\s*\n/)) strings.push({ what: `a paper found later (${paper.id})`, text: paragraph });
    }
    for (const entry of views) {
      checkId(`${where}, view`, entry.id);
      if (entry.back && !everyView.has(entry.back)) problems.push(`${where}: view "${entry.id}" goes back to "${entry.back}", which does not exist.`);
      strings.push({ what: `a place found later (${entry.id})`, text: entry.lede });
      strings.push({ what: `a place found later (${entry.id}), its picture`, text: entry.picture.alt });
    }
    for (const entry of things) {
      checkThing(`${where}, thing ${entry.id}`, entry, everyView, everyPaper);
      if (entry.to && !everyView.has(entry.to)) problems.push(`${where}: thing "${entry.id}" leads to "${entry.to}", which does not exist.`);
      strings.push({ what: `a thing found later (${entry.id})`, text: entry.text });
      if (entry.picture) strings.push({ what: `a thing found later (${entry.id}), its picture`, text: entry.picture.alt });
    }
    if (reveal.report) {
      reportDef = reveal.report;
      for (const question of reveal.report.questions) {
        for (const option of question.options) strings.push({ what: `the report, a choice for "${question.id}"`, text: option.label });
      }
    }
    return compact({
      ...(tools.length > 0 ? { tools } : {}),
      ...(drop.length > 0 ? { drop } : {}),
      ...(papers.length > 0 ? { papers } : {}),
      ...(views.length > 0 ? { views } : {}),
      ...(things.length > 0 ? { things } : {}),
      ...(reveal.report ? { report: reveal.report } : {}),
    });
  };

  const waitsOn = (where: string, flags: string[] | undefined) => {
    for (const flag of flags ?? []) {
      checkId(`${where}, flag`, flag);
      usedFlags.push({ where, flag });
    }
  };

  // Reactions.
  const reactionIds = new Set<string>();
  const reactions: Reaction[] = [];
  for (const reaction of sealed.reactions) {
    const where = `reaction ${reaction.id}`;
    checkId(where, reaction.id);
    if (reactionIds.has(reaction.id)) problems.push(`${where}: there are two of them.`);
    reactionIds.add(reaction.id);
    if (!everyTool.has(reaction.tool)) problems.push(`${where}: tool "${reaction.tool}" never exists.`);
    if (!everyThing.has(reaction.target)) problems.push(`${where}: thing "${reaction.target}" never exists.`);
    if (!isText(reaction.text)) problems.push(`${where}: it says nothing.`);
    waitsOn(where, reaction.when);
    waitsOn(where, reaction.unless);
    for (const flag of reaction.set ?? []) {
      checkId(`${where}, flag`, flag);
      setFlags.add(flag);
    }
    // Something gained twice could put back a thing that has since changed.
    if (reaction.reveal && !(reaction.set ?? []).some((flag) => (reaction.unless ?? []).includes(flag))) {
      problems.push(`${where}: it gives something, so it must happen once: set a flag and list the same flag under "unless".`);
    }
    strings.push({ what: `what happens (${reaction.id})`, text: reaction.text });
    reactions.push(compact({ ...reaction, reveal: resolve(where, reaction.reveal) }));
  }

  // A plain reaction that stands before a conditional one for the same pair hides it.
  sealed.reactions.forEach((reaction, index) => {
    if ((reaction.when ?? []).length > 0 || (reaction.unless ?? []).length > 0) return;
    const hidden = sealed.reactions.slice(index + 1).find((later) => later.tool === reaction.tool && later.target === reaction.target);
    if (hidden) problems.push(`reaction ${reaction.id}: it always fits, so "${hidden.id}" after it can never happen. Put the plain one last.`);
  });

  // Locks.
  const locks: Secrets['locks'] = [];
  for (const lock of sealed.locks) {
    const where = `lock ${lock.id}`;
    const def = content.locks.find((candidate) => candidate.id === lock.id);
    if (!def) {
      problems.push(`${where}: the room has no such lock.`);
      continue;
    }
    const faces = new Set(def.faces.map((face) => face.id));
    if (!isList(lock.answer) || lock.answer.length !== def.wheels.length || !lock.answer.every((face) => faces.has(face))) {
      problems.push(`${where}: its setting must be one face for each of its ${def.wheels.length} rings.`);
      continue;
    }
    if (!isText(lock.text)) problems.push(`${where}: it says nothing when it opens.`);
    waitsOn(where, lock.when);
    const flags = lock.set ?? [openFlag(lock.id)];
    for (const flag of flags) setFlags.add(flag);
    strings.push({ what: `what happens when a lock opens (${lock.id})`, text: lock.text });
    locks.push(
      compact({
        id: lock.id,
        hashes: [hashExact(lockValue(lock.answer))],
        when: lock.when,
        text: lock.text,
        set: flags,
        reveal: resolve(where, lock.reveal),
      }),
    );
  }
  for (const def of content.locks) {
    if (!locks.some((lock) => lock.id === def.id)) problems.push(`lock ${def.id}: the answers file has no setting for it, so it could never open.`);
  }

  // Hints.
  const hintIds = new Set<string>();
  for (const topic of sealed.hints) {
    const where = `hint ${topic.id}`;
    checkId(where, topic.id);
    if (hintIds.has(topic.id)) problems.push(`${where}: there are two of them.`);
    hintIds.add(topic.id);
    if (!isText(topic.label)) problems.push(`${where}: it needs a label.`);
    if (!isList(topic.tiers) || topic.tiers.length !== HINT_TIERS || !topic.tiers.every(isText)) {
      problems.push(`${where}: it needs exactly ${HINT_TIERS} hints, cheapest first.`);
    }
    waitsOn(where, topic.when);
    waitsOn(where, topic.until);
    if ((topic.until ?? []).length === 0) problems.push(`${where}: it never closes. Say which flag ends it.`);
    // The label is only the name of a thing in the room. What he says about it is the secret.
    (topic.tiers ?? []).forEach((text, index) => strings.push({ what: `${where}, tier ${index + 1}`, text }));
  }

  // The report.
  const rules = sealed.report;
  const answers: Record<string, string> = {};
  if (!reportDef) {
    problems.push('report: nothing ever gives a visitor the three questions. Put "report" in the reveal of whatever opens the way out.');
  } else {
    for (const question of reportDef.questions) {
      const answer = rules.answers?.[question.id];
      if (!isText(answer) || !question.options.some((option) => option.id === answer)) {
        problems.push(`report: the answer to "${question.id}" must be the id of one of its choices.`);
        continue;
      }
      answers[question.id] = hashExact(answer);
      if (!isList(rules.needs?.[question.id]) || rules.needs[question.id]?.length === 0) problems.push(`report: nothing proves "${question.id}".`);
      if (!isText(rules.unproven?.[question.id]) || !isText(rules.wrong?.[question.id])) problems.push(`report: "${question.id}" needs a line for unproven and a line for wrong.`);
      waitsOn(`report, ${question.id}`, rules.needs?.[question.id]);
      strings.push({ what: `the report, "${question.id}" not proved`, text: rules.unproven?.[question.id] ?? '' });
      strings.push({ what: `the report, "${question.id}" wrong`, text: rules.wrong?.[question.id] ?? '' });
    }
    for (const question of Object.keys(rules.answers ?? {})) {
      if (!reportDef.questions.some((candidate) => candidate.id === question)) problems.push(`report: there is an answer for "${question}", which is not asked.`);
    }
  }
  waitsOn('report', rules.when);
  if (!isText(rules.closed?.title) || !isText(rules.closed?.body)) problems.push('report: the closing account is missing.');
  else for (const paragraph of rules.closed.body.split(/\n\s*\n/)) strings.push({ what: 'the closing account', text: paragraph });
  if (isText(rules.early)) strings.push({ what: 'the report, too early', text: rules.early });

  for (const { where, flag } of usedFlags) {
    if (!setFlags.has(flag)) problems.push(`${where}: it waits on "${flag}", which nothing ever sets.`);
  }
  for (const [tool, text] of Object.entries(sealed.defaults)) {
    if (!everyTool.has(tool)) problems.push(`defaults: tool "${tool}" never exists.`);
    if (!isText(text)) problems.push(`defaults: "${tool}" says nothing.`);
  }
  for (const tool of everyTool) {
    if (!isText(sealed.defaults[tool])) problems.push(`defaults: there is no line for "${tool}" when nothing happens.`);
  }
  if (!isText(sealed.fallback)) problems.push('The "fallback" line is missing.');

  const secrets: Secrets = compact({
    tools: [...toolIds],
    things: [...thingIds],
    defaults: sealed.defaults,
    fallback: sealed.fallback,
    reactions,
    locks,
    hints: sealed.hints,
    report: {
      when: rules.when ?? [],
      early: rules.early ?? '',
      answers,
      needs: rules.needs ?? {},
      unproven: rules.unproven ?? {},
      wrong: rules.wrong ?? {},
      closed: rules.closed ?? { title: '', body: '' },
    },
  });

  // What is in the room from the start must not already say what is sealed.
  const open = JSON.stringify(content);
  for (const secret of strings) {
    if (secret.text.trim().length >= 24 && open.includes(secret.text.trim())) {
      problems.push(`${secret.what}: the same words are in scripts/content/goldmaker.ts, where anyone can read them.`);
    }
  }

  const walkthrough = isList(sealed.walkthrough) ? sealed.walkthrough : [];
  if (problems.length === 0) problems.push(...walk(secrets, walkthrough).problems);

  return { content, secrets, walkthrough, strings: strings.filter((secret) => isText(secret.text)), problems };
}

/** A clock for walking the room: every step is a minute after the last. */
export function steppingClock(start = 1_000_000): Clock<number> & { tick(): void } {
  const clock = {
    now: start,
    millis: (stamp: number) => stamp,
    tick() {
      clock.now += 60_000;
    },
  };
  return clock;
}

/**
 * Walks the room from the door to the report, the way the answers file says
 * it is done. If that walk does not end with the case closed and nothing
 * marked against it, the room cannot be solved as written.
 */
export function walk(secrets: Secrets, steps: Step[]): { problems: string[]; marks: number; closed: boolean } {
  const problems: string[] = [];
  const clock = steppingClock();
  const player = enter(secrets, 'The Walker', clock);

  if (steps.length === 0) problems.push('walkthrough: the answers file does not say how the room is solved.');

  steps.forEach((step, index) => {
    const where = `walkthrough, step ${index + 1} (${JSON.stringify(step)})`;
    clock.tick();
    try {
      if (step[0] === 'try') {
        const result = tryTool(secrets, player, step[1], step[2], clock);
        if (!result.noted && result.gained.length === 0) problems.push(`${where}: nothing in particular happened.`);
      } else if (step[0] === 'set') {
        const result = setLock(secrets, player, step[1], step[2], clock, hashExact);
        if (!result.open) problems.push(`${where}: the lock did not open.`);
      } else if (step[0] === 'hint') {
        takeHint(secrets, player, step[1], step[2]);
      } else {
        const result = report(secrets, player, step[1], clock, hashExact);
        if (!result.closed) problems.push(`${where}: the report was not accepted (${(result.failed ?? []).join(', ')}).`);
      }
    } catch (error) {
      problems.push(`${where}: ${error instanceof Refusal ? error.message : String(error)}`);
    }
  });

  const closed = Boolean(player.closedAt);
  if (steps.length > 0 && !closed) problems.push('walkthrough: it ends with the case still open.');
  if (closed && player.marks !== 0) problems.push(`walkthrough: it ends with ${player.marks} mark(s) against it. The honest way through should cost nothing.`);
  return { problems, marks: player.marks, closed };
}
