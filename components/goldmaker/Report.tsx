'use client';

import { type FormEvent, useState } from 'react';
import { track } from '@/lib/firebase';
import { describeFailure, sendReport } from '@/lib/goldmaker/api';
import { type CellarPlayer, MISSED_REPORT_MARKS } from '@/lib/goldmaker/shape';

/**
 * The report: the three things the Emperor asked, said through the hatch
 * from the outside.
 *
 * The questions and what can be answered to each arrive in the visitor's
 * file only when the way out is found. Which answers are true is checked by
 * the function, and each has to have been proved in the cellar before it is
 * weighed at all.
 */
export function Report({ player }: { player: CellarPlayer }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [back, setBack] = useState<{ lines: string[]; marked: boolean } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const report = player.report;
  if (!report) return null;
  const complete = report.questions.every((question) => answers[question.id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !complete) return;
    setBusy(true);
    setBack(null);
    setProblem(null);
    try {
      const result = await sendReport(answers);
      if (result.closed) void track('goldmaker_closed', { rank: result.rank ?? '', marks: result.marks ?? 0 });
      else setBack({ lines: result.lines ?? [], marked: Boolean(result.marked) });
    } catch (error) {
      setProblem(describeFailure(error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 border-t border-line pt-6" data-testid="report">
      <h3 className="title title--3">Your report</h3>
      <p className="mt-2">
        You knock. The hatch opens on the captain’s face, and then on a good deal more of it. “{report.ask}”
      </p>

      {report.questions.map((question) => (
        <fieldset key={question.id} className="mt-6">
          <legend className="text-[1.2rem] text-brass">{question.ask}</legend>
          <ul className="list mt-2">
            {question.options.map((option) => (
              <li key={option.id}>
                <label className="flex min-h-[44px] cursor-pointer items-start gap-3 px-1 py-2.5">
                  <input
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={answers[question.id] === option.id}
                    onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                    className="mt-1.5 size-4 flex-none accent-[var(--brass)]"
                    data-testid={`report-${question.id}-${option.id}`}
                  />
                  <span>{option.label}.</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ))}

      <p className="mt-6">
        <button type="submit" className="btn btn--solid" disabled={busy || !complete} data-testid="report-send">
          {busy ? 'He is writing it down' : 'Say it'}
        </button>
        {!complete ? <span className="mute ml-4">Answer all three.</span> : null}
      </p>

      <div role="status" className="mt-5" data-testid="report-back">
        {back ? (
          <div className="happened">
            <p>The captain puts down his pen. “He will not have that from me.”</p>
            {back.lines.map((line) => (
              <p key={line} className="mt-2">
                {line}
              </p>
            ))}
            <p className="mute mt-2">
              {back.marked
                ? `${MISSED_REPORT_MARKS} marks are written against your name.`
                : 'Nothing is written against your name. Go back in and find out.'}
            </p>
          </div>
        ) : null}
        {problem ? <p className="happened happened--plain">{problem}</p> : null}
      </div>
    </form>
  );
}
