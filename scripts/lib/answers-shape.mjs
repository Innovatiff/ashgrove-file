// What an answers file looks like.
//
// It is plain JavaScript with no imports, because the first step of the
// deploy reads it before anything has been installed. That step opens
// answers.sealed.json and has to decide whether what came out of it is an
// answers file at all, before it is put where the tests and the seed look
// for it.
//
// The first room keeps one entry for each of its locks, and every entry has
// its `answer`. A room that came later keeps its whole sealed half under one
// key of its own, in a shape of its own.
//
// ADDING A ROOM: give its key an entry in ROOMS. A key that is missing here
// is taken for a lock of the first room with no answer, the file is not
// recognised, and the deploy stops before it changes anything.

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Key in answers.json -> whether the entry under it is that room's sealed half. */
export const ROOMS = {
  goldmaker: (entry) =>
    Array.isArray(entry.reactions) &&
    Array.isArray(entry.locks) &&
    Array.isArray(entry.hints) &&
    isObject(entry.report) &&
    isObject(entry.defaults),
};

/** The keys of the rooms that keep their sealed half under a key of their own. */
export const ROOM_KEYS = Object.freeze(Object.keys(ROOMS));

const isAnswer = (answer) =>
  typeof answer === 'string' || (Array.isArray(answer) && answer.length > 0 && answer.every((one) => typeof one === 'string'));

/** The entries that count: a key that starts with an underscore is a note to the reader. */
const entriesOf = (value) => Object.entries(value).filter(([name]) => !name.startsWith('_'));

/**
 * True for the parsed contents of an answers file: the first room's locks,
 * each with its answer, and the sealed half of any room that came later.
 */
export function looksLikeAnswers(value) {
  if (!isObject(value)) return false;
  const entries = entriesOf(value);
  const locks = entries.filter(([name]) => !Object.hasOwn(ROOMS, name));
  return (
    locks.length > 0 &&
    entries.every(([name, entry]) => isObject(entry) && (Object.hasOwn(ROOMS, name) ? ROOMS[name](entry) : isAnswer(entry.answer)))
  );
}

/** How many entries an answers file holds, notes aside. */
export function countOf(value) {
  return isObject(value) ? entriesOf(value).length : 0;
}
