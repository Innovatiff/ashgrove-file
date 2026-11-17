/**
 * Reading answers.json: the one file that holds the codes.
 *
 * The seed script and the bundle check both need it, and both need to agree
 * about what is in it. This reads the file's shape and nothing else: whether
 * the answers fit the rooms is the seed script's business.
 */

import { type GateId, HINT_TIERS, isGateId, ROOM_ORDER, THRESHOLD, VERDICT } from '../../functions/src/config/game';
import { normaliseAnswer } from '../../functions/src/lib/answers';
import type { EvidenceContent } from './types';

/** A card a solved gate gives up. */
export interface EvidenceEntry extends Omit<EvidenceContent, 'room'> {
  id: string;
}

/** One gate: the door or a room. */
export interface GateEntry {
  /** Every accepted way of writing the code. The first is the one the file means. */
  answers: string[];
  /** Three, cheapest first. The door has none. */
  hints: string[];
  evidence: EvidenceEntry[];
}

/** The accusation. */
export interface VerdictEntry {
  /** The id of the one who did it. */
  answer: string;
  /** suspect id -> why it was not them. */
  rebuttals: Record<string, string>;
  evidence: EvidenceEntry[];
}

export interface AnswersFile {
  gates: Map<GateId, GateEntry>;
  verdict: VerdictEntry | null;
  problems: string[];
}

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function readEvidence(where: string, raw: unknown, problems: string[]): EvidenceEntry[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    problems.push(`${where}: "evidence" must be a list of cards.`);
    return [];
  }
  const cards: EvidenceEntry[] = [];
  for (const card of raw as unknown[]) {
    if (!isObject(card) || !isText(card.id) || !/^[a-z0-9][a-z0-9-]*$/.test(card.id)) {
      problems.push(`${where}: every evidence card needs an "id" of lowercase letters, digits and hyphens.`);
    } else if (!isText(card.title) || !isText(card.body)) {
      problems.push(`${where}: evidence "${card.id}" needs a "title" and a "body".`);
    } else {
      cards.push({
        id: card.id,
        title: card.title,
        body: card.body,
        ...(isText(card.reveal) ? { reveal: card.reveal } : {}),
      });
    }
  }
  return cards;
}

/** Reads the parsed JSON of an answers file. Problems are collected, not thrown. */
export function readAnswers(raw: unknown): AnswersFile {
  const problems: string[] = [];
  const gates = new Map<GateId, GateEntry>();
  let verdict: VerdictEntry | null = null;

  if (!isObject(raw)) return { gates, verdict, problems: ['The answers file must be one JSON object.'] };

  for (const [key, entry] of Object.entries(raw)) {
    if (key.startsWith('_')) continue;

    if (key === VERDICT) {
      if (!isObject(entry) || !isText(entry.answer)) {
        problems.push('verdict: "answer" must be the id of one suspect.');
        continue;
      }
      const rebuttals: Record<string, string> = {};
      if (isObject(entry.rebuttals)) {
        for (const [suspect, text] of Object.entries(entry.rebuttals)) {
          if (isText(text)) rebuttals[suspect] = text;
          else problems.push(`verdict: the rebuttal for "${suspect}" is empty.`);
        }
      } else {
        problems.push('verdict: "rebuttals" must say, for each of the others, why it was not them.');
      }
      verdict = { answer: entry.answer.trim(), rebuttals, evidence: readEvidence('verdict', entry.evidence, problems) };
      continue;
    }

    if (!isGateId(key)) {
      problems.push(`"${key}" is not a gate. Use "${THRESHOLD}", "${VERDICT}" or one of: ${ROOM_ORDER.join(', ')}.`);
      continue;
    }
    if (!isObject(entry)) {
      problems.push(`${key}: "answer" is missing.`);
      continue;
    }

    const listed = Array.isArray(entry.answer) ? (entry.answer as unknown[]) : [entry.answer];
    const answers = listed.filter(isText).map((answer) => answer.trim());
    if (answers.length === 0 || answers.length !== listed.length) {
      problems.push(`${key}: "answer" must be the code, or a list of accepted ways of writing it.`);
      continue;
    }
    if (answers.some((answer) => normaliseAnswer(answer).length === 0)) {
      problems.push(`${key}: an answer is empty once spaces and punctuation are stripped.`);
    }

    let hints: string[] = [];
    if (key === THRESHOLD) {
      if (Array.isArray(entry.hints) && entry.hints.length > 0) problems.push('threshold: the door has no hints. Remove "hints".');
    } else if (!Array.isArray(entry.hints) || entry.hints.length !== HINT_TIERS || !entry.hints.every(isText)) {
      problems.push(`${key}: "hints" must be exactly ${HINT_TIERS} non-empty strings, cheapest first.`);
    } else {
      hints = entry.hints as string[];
    }

    gates.set(key, { answers, hints, evidence: readEvidence(key, entry.evidence, problems) });
  }

  return { gates, verdict, problems };
}

/** Everything in the file that must never reach a browser unasked, with what it is. */
export function secretsOf(file: AnswersFile): Array<{ what: string; text: string }> {
  const secrets: Array<{ what: string; text: string }> = [];
  // A bare number is too short and too common to search a bundle for. The
  // redacted value beside it, which carries its unit, is checked instead.
  const searchable = (text: string) => !/^[\d.,\s]+$/.test(text);

  for (const [gate, entry] of file.gates) {
    // The word on the landing page is hidden in plain sight there by design.
    if (gate === THRESHOLD) continue;
    for (const answer of entry.answers) if (searchable(answer)) secrets.push({ what: `${gate}: the code`, text: answer });
    entry.hints.forEach((hint, index) => {
      if (searchable(hint)) secrets.push({ what: `${gate}: hint ${index + 1}`, text: hint });
    });
    for (const card of entry.evidence) {
      secrets.push({ what: `${gate}: evidence text`, text: card.body });
      if (card.reveal) secrets.push({ what: `${gate}: redacted value`, text: card.reveal });
    }
  }

  if (file.verdict) {
    for (const [suspect, text] of Object.entries(file.verdict.rebuttals)) {
      secrets.push({ what: `verdict: why it was not ${suspect}`, text });
    }
    for (const card of file.verdict.evidence) {
      // The account is headed with a name that is on the wall for anyone to
      // read. The name is not the secret. What is said under it is.
      // One long text is searched paragraph by paragraph: a single line of it is a leak.
      for (const paragraph of card.body.split(/\n\s*\n/)) secrets.push({ what: 'verdict: the closing account', text: paragraph });
    }
  }

  return secrets;
}
