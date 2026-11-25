'use client';

import { useState } from 'react';
import { track } from '@/lib/firebase';
import { askCaptain, describeFailure } from '@/lib/goldmaker/api';
import { type CellarPlayer, HINT_MARKS, HINT_TIERS } from '@/lib/goldmaker/shape';
import { tally } from '@/lib/goldmaker/world';

const ORDINAL = ['first', 'second', 'third'];
const marksWord = (n: number) => `${n} ${n === 1 ? 'mark' : 'marks'}`;

/**
 * The captain, at the hatch. He can be asked about whatever a visitor could
 * be stuck on at the moment, and about nothing they have not met yet.
 *
 * He answers each thing in three steps, each plainer than the last, and each
 * is marked against the visitor's name before it is given. What he has said
 * already can be read again for nothing. His answers are never in the page:
 * each one comes from the function when it is asked for.
 */
export function Captain({ player }: { player: CellarPlayer }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const open = player.topics ?? [];
  const openIds = new Set(open.map((topic) => topic.id));
  // Things he was asked about that are settled now: his answers stay readable.
  const settled = Object.entries(player.hints ?? {})
    .filter(([id]) => !openIds.has(id))
    .map(([id, taken]) => ({ id, label: taken.label }));

  const ask = async (topic: string, tier: number) => {
    if (busy) return;
    setBusy(topic);
    setProblem(null);
    try {
      const hint = await askCaptain(topic, tier);
      if (hint.marksAdded > 0) void track('goldmaker_hint', { topic, tier });
    } catch (error) {
      setProblem(describeFailure(error).message);
    } finally {
      setBusy(null);
    }
  };

  const said = (id: string) => player.hints?.[id]?.said ?? [];

  return (
    <div data-testid="captain">
      <p>
        The shutter slides back. “Ask, Assay-Master. I answer a thing three times, each plainer than the last, and each
        is written against your name: {marksWord(HINT_MARKS[0])} for the first, {HINT_MARKS[1]} for the second,{' '}
        {HINT_MARKS[2]} for the third. The third is the answer.”
      </p>
      <p className="mt-3" data-testid="marks">
        Against your name so far:{' '}
        {player.marks > 0 ? (
          <>
            <span className="brass" aria-hidden="true">
              {tally(player.marks)}
            </span>{' '}
            ({marksWord(player.marks)})
          </>
        ) : (
          'nothing'
        )}
        .
      </p>

      {problem ? (
        <p role="alert" className="happened happened--plain mt-4">
          {problem}
        </p>
      ) : null}

      <ul className="mt-6 grid gap-6">
        {open.map((topic) => {
          const answers = said(topic.id);
          const next = answers.length + 1;
          return (
            <li key={topic.id} className="border-t border-line pt-4" data-testid={`topic-${topic.id}`}>
              <h3 className="title title--3">{topic.label}</h3>
              {answers.length > 0 ? (
                <ol className="noted mt-3">
                  {answers.map((text, index) => (
                    <li key={index}>{text}</li>
                  ))}
                </ol>
              ) : null}
              {next <= HINT_TIERS ? (
                <p className="mt-3">
                  <button type="button" className="btn btn--small" onClick={() => ask(topic.id, next)} disabled={busy !== null} data-testid={`ask-${topic.id}`}>
                    {busy === topic.id ? 'He is thinking' : `Ask the ${ORDINAL[next - 1]} time (${marksWord(HINT_MARKS[next - 1] ?? 0)})`}
                  </button>
                </p>
              ) : (
                <p className="mute mt-3">He has no more to say about that.</p>
              )}
            </li>
          );
        })}
        {open.length === 0 ? <li className="mute">“There is nothing left for me to tell you.”</li> : null}
      </ul>

      {settled.length > 0 ? (
        <>
          <h3 className="label mt-8">What he told you before</h3>
          <ul className="mt-3 grid gap-5">
            {settled.map((topic) => (
              <li key={topic.id}>
                <p className="brass">{topic.label}</p>
                <ol className="noted mt-2">
                  {said(topic.id).map((text, index) => (
                    <li key={index}>{text}</li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
