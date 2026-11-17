'use client';

import Link from 'next/link';
import { type FormEvent, useId, useState } from 'react';
import { Clearance } from '@/components/gate/Clearance';
import { useProgress } from '@/components/providers/ProgressProvider';
import { useEvidence, useVerdict } from '@/components/room/useRoom';
import { WitnessCard } from '@/components/room/WitnessCard';
import { DoubleRule } from '@/components/ui/DoubleRule';
import { EvidenceCard } from '@/components/ui/EvidenceCard';
import { Frame } from '@/components/ui/Frame';
import { PinnedPhoto } from '@/components/ui/PinnedPhoto';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { accuse, describeFailure } from '@/lib/api';
import type { EvidenceContent, Suspect, VerdictContent } from '@/lib/content';
import { track } from '@/lib/firebase';
import { cx, elapsed, hourMinute } from '@/lib/format';
import {
  clearedEvidenceId,
  MISSED_ACCUSATION_MINUTES,
  RANKS,
  ROOM_ORDER,
  roomNumeral,
  routeForRoom,
  STARTING_ACCUSATIONS,
} from '@/lib/rooms';

/**
 * The last page of the file. Five photographs, the detective's own evidence,
 * and one name to give.
 *
 * Like a room, it holds nothing of its own. Who is on the wall and what each
 * of them said arrive from Firestore once the seventh room is solved. Who did
 * it is not in the browser at all: a name is sent to the accuse function,
 * which answers yes, or says why not.
 */
export function Verdict() {
  const { player, progress } = useProgress();
  const state = useVerdict();
  const earned = useEvidence(progress.evidence);

  if (state.status === 'loading') return <Clearance state="checking" />;
  if (state.status === 'denied') return <Clearance state="denied" />;
  if (state.status === 'error') return <Clearance state="error" />;
  if (state.status === 'missing') return <Uncatalogued />;

  const dossier = state.room;
  const closed = progress.closedAt !== null;
  const sealed = !closed && progress.accusationsLeft <= 0;
  const opened = player?.solved?.[ROOM_ORDER[ROOM_ORDER.length - 1] as string]?.toDate() ?? null;
  const account = closed ? earned[dossier.account] : undefined;

  const cards = ROOM_ORDER.flatMap((room) =>
    Object.entries(earned)
      .filter(([, card]) => card.room === room)
      .map(([id, card]) => ({ id, room, card })),
  );

  return (
    <article data-verdict={closed ? 'closed' : sealed ? 'sealed' : 'open'}>
      {/* ------------------------------------------------------ header -- */}
      <header className="measure pt-12 md:pt-20">
        <Reveal>
          <p className="mono muted">
            After Room VII
            {progress.badge ? (
              <>
                <span className="strip__slash" aria-hidden="true">
                  /
                </span>
                Badge {progress.badge}
              </>
            ) : null}
          </p>
          <h1 className="title title--room mt-4">{dossier.title}</h1>
          <p className="mono mono--lg mt-6 text-paper" data-testid="file-opened">
            File opened {opened ? hourMinute(opened) : '--:--'} by Det. {progress.detectiveName ?? 'Unassigned'}
          </p>
        </Reveal>
        {!closed && dossier.lede.length > 0 ? (
          <Reveal className="copy mt-8 text-paper">
            {dossier.lede.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </Reveal>
        ) : null}
      </header>

      {closed ? <CaseClosed dossier={dossier} account={account} /> : null}

      {/* ---------------------------------------------------- the wall -- */}
      <Section labelledBy="wall-title" className="mt-10 py-10 md:mt-12 md:py-14">
        <Reveal>
          <DoubleRule id="wall-title" title="The Wall" note={`${dossier.suspects.length} photographs · ${dossier.suspects.length} statements`} />
        </Reveal>

        <div className="mt-12 grid gap-x-10 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
          {dossier.suspects.map((suspect) => {
            const cleared = progress.accused.includes(suspect.id);
            const reason = earned[clearedEvidenceId(suspect.id)]?.body;
            return (
              <Reveal key={suspect.id}>
                <div data-suspect={suspect.id} data-cleared={cleared || undefined}>
                  <WitnessCard witness={suspect} as="h3" layout="stacked" />
                  {cleared ? (
                    <Frame label="Named" className="mt-6 px-5 pb-5 pt-7">
                      <p className="mono muted">You accused them. It was not them.</p>
                      {reason ? (
                        <p className="document mt-3 text-paper" data-testid={`cleared-${suspect.id}`}>
                          {reason}
                        </p>
                      ) : null}
                    </Frame>
                  ) : null}
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* ------------------------------------------------ the evidence -- */}
      <Section labelledBy="evidence-title" className="py-10 md:py-14">
        <Reveal>
          <DoubleRule id="evidence-title" title="Your Evidence" note={`${cards.length} cards, in the order you earned them`} />
        </Reveal>

        <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ id, room, card }) => (
            <Reveal key={id}>
              <EvidenceCard
                variant="evidence"
                label={card.title}
                reference={`Room ${roomNumeral(room)}`}
                stamp={
                  <Link href={routeForRoom(room)} className="link">
                    Go back over Room {roomNumeral(room)}
                  </Link>
                }
              >
                {card.body}
              </EvidenceCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------- the name -- */}
      {closed ? null : (
        <Section labelledBy="name-title" className="py-10 md:py-14">
          <Reveal>
            <DoubleRule id="name-title" title="The Name" note="Three accusations. They do not come back." />
          </Reveal>

          <div className="mx-auto mt-10 max-w-[820px]">
            {sealed ? (
              <Reveal>
                <Frame label="Sealed" className="px-6 pb-8 pt-10 md:px-10" role="status">
                  <p className="title title--lead">The file is sealed again.</p>
                  <div className="copy mt-5 text-paper">
                    <p>You named three people. None of them carried the lamp.</p>
                    <p>Ashgrove keeps its legend. The papers stay as you left them, and so does the answer.</p>
                  </div>
                  <Link href={routeForRoom(ROOM_ORDER[0])} className="btn mt-7">
                    Go back over Room I
                  </Link>
                </Frame>
              </Reveal>
            ) : (
              <Reveal>
                <AccusationForm
                  prompt={dossier.prompt}
                  suspects={dossier.suspects}
                  accused={progress.accused}
                  left={progress.accusationsLeft}
                />
              </Reveal>
            )}
          </div>
        </Section>
      )}
    </article>
  );
}

// ---------------------------------------------------------------- the form --

interface AccusationFormProps {
  prompt: string;
  suspects: Suspect[];
  accused: string[];
  left: number;
}

type Answer =
  | { kind: 'missed'; name: string; rebuttal: string; left: number }
  | { kind: 'closing' }
  | { kind: 'error'; message: string };

function AccusationForm({ prompt, suspects, accused, left }: AccusationFormProps) {
  const id = useId();
  const [chosen, setChosen] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);

  const suspect = suspects.find((candidate) => candidate.id === chosen && !accused.includes(candidate.id)) ?? null;
  const number = STARTING_ACCUSATIONS - left + 1;

  function ask(event: FormEvent) {
    event.preventDefault();
    if (!suspect || pending) return;
    setAnswer(null);
    setConfirming(true);
  }

  async function confirm() {
    if (!suspect || pending) return;
    setPending(true);
    try {
      const result = await accuse(suspect.id);
      void track('accusation', { correct: result.correct });
      if (result.correct) {
        // The file itself changes a moment later, and the page with it.
        setAnswer({ kind: 'closing' });
      } else {
        setAnswer({
          kind: 'missed',
          name: suspect.name,
          rebuttal: result.rebuttal ?? 'No. The evidence says otherwise.',
          left: result.accusationsLeft,
        });
        setChosen(null);
      }
    } catch (error) {
      setAnswer({ kind: 'error', message: describeFailure(error).message });
    } finally {
      setPending(false);
      setConfirming(false);
    }
  }

  return (
    <Frame active label="Unanswered" mark={`Accusation ${Math.min(number, STARTING_ACCUSATIONS)} of ${STARTING_ACCUSATIONS}`} className="px-6 pb-8 pt-10 md:px-10 md:pb-10 md:pt-12">
      <form onSubmit={ask} noValidate>
        <fieldset disabled={pending || confirming || answer?.kind === 'closing'}>
          <legend className="mono mono--lg">{prompt}</legend>

          <div className="mt-5 border-t border-line">
            {suspects.map((candidate) => {
              const spent = accused.includes(candidate.id);
              return (
                <label key={candidate.id} htmlFor={`${id}-${candidate.id}`} className={cx('choice', spent && 'choice--spent')}>
                  <input
                    id={`${id}-${candidate.id}`}
                    type="radio"
                    name="suspect"
                    className="checkbox"
                    value={candidate.id}
                    checked={chosen === candidate.id && !spent}
                    disabled={spent}
                    onChange={() => {
                      setChosen(candidate.id);
                      if (answer?.kind === 'error') setAnswer(null);
                    }}
                  />
                  <span>
                    <span className="title text-2xl md:text-3xl">{candidate.name}</span>
                    <span className="mono muted mt-2 block">{spent ? 'Named already. It was not them.' : candidate.role}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {confirming ? null : (
            <button type="submit" className="btn btn--ember mt-7" disabled={!suspect}>
              Accuse
            </button>
          )}
        </fieldset>
      </form>

      {confirming && suspect ? (
        <div className="mt-7 border-t border-line pt-6" data-testid="confirm-accusation">
          <p className="text-paper">
            You are about to accuse {suspect.name}. This is accusation {number} of {STARTING_ACCUSATIONS}. It goes on the
            file and it does not come back.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn btn--ember" disabled={pending} onClick={confirm}>
              {pending ? 'Putting it on the file' : `Accuse ${suspect.name}`}
            </button>
            <button type="button" className="btn" disabled={pending} onClick={() => setConfirming(false)}>
              Not yet
            </button>
          </div>
        </div>
      ) : null}

      <div role="status" aria-live="polite" className="mt-6 min-h-[1.6em]" data-testid="accusation-status">
        {answer?.kind === 'missed' ? (
          <div className="border-t border-line pt-6">
            <p className="mono muted">The file answers. {answer.name}:</p>
            <p className="document mt-3 text-paper" data-testid="rebuttal">
              {answer.rebuttal}
            </p>
            <p className="mono mt-4 text-paper">
              {answer.left} {answer.left === 1 ? 'accusation' : 'accusations'} left.
            </p>
          </div>
        ) : answer?.kind === 'closing' ? (
          <p className="mono text-paper">Correct. The file is being closed.</p>
        ) : answer?.kind === 'error' ? (
          <p className="mono text-paper">{answer.message}</p>
        ) : null}
      </div>
    </Frame>
  );
}

// ------------------------------------------------------------- case closed --

function CaseClosed({ dossier, account }: { dossier: VerdictContent; account: EvidenceContent | undefined }) {
  const { progress } = useProgress();
  const culprit = account ? dossier.suspects.find((suspect) => suspect.name === account.title) : undefined;
  const missed = STARTING_ACCUSATIONS - progress.accusationsLeft;
  const onFile =
    progress.oathAt && progress.closedAt ? elapsed(progress.closedAt.getTime() - progress.oathAt.getTime()) : '--:--:--';

  const ledger: Array<[string, string]> = [
    ['Time on file', onFile],
    ['Hints', progress.hintPenalty > 0 ? `+${progress.hintPenalty} min` : 'None taken'],
    ['Accusations', `${missed + 1} of ${STARTING_ACCUSATIONS}`],
    ['Closed', progress.closedAt ? hourMinute(progress.closedAt) : '--:--'],
  ];

  return (
    <Section labelledBy="closed-title" className="mt-10 py-10 md:mt-12 md:py-14">
      <Reveal>
        <DoubleRule id="closed-title" title="Case Closed" note="File 001. Ashgrove. No longer sealed." />
      </Reveal>

      <div className="mt-12 grid items-start gap-x-12 gap-y-12 lg:grid-cols-12">
        {culprit ? (
          <Reveal className="lg:col-span-4">
            <PinnedPhoto
              src={culprit.src}
              width={culprit.width}
              height={culprit.height}
              alt={culprit.alt}
              caption={culprit.caption}
              sizes="(min-width: 1024px) 320px, 70vw"
              className="mx-auto w-full max-w-[320px]"
            />
          </Reveal>
        ) : null}

        <Reveal className={culprit ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <Frame active label="The hand" className="px-6 pb-8 pt-10 md:px-10 md:pb-10 md:pt-12">
            {account ? (
              <>
                <h2 className="title title--lead ember" data-testid="culprit">
                  {account.title}
                </h2>
                <div className="document paper mt-6 text-paper" data-testid="account">
                  {account.body.split(/\n\s*\n/).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </>
            ) : (
              <p className="mono text-paper">Retrieving the closing account from the file.</p>
            )}
          </Frame>
        </Reveal>
      </div>

      <Reveal className="mt-12">
        <Frame label="Your rank" className="px-6 pb-8 pt-10 md:px-10">
          <p className="title title--section ember" data-testid="rank">
            {progress.rank ?? 'Unranked'}
          </p>
          <ol className="mono run mt-5" aria-label="The ranks, lowest first">
            {RANKS.map((rank, index) => (
              <li key={rank} className={rank === progress.rank ? 'text-paper' : 'muted'} aria-current={rank === progress.rank || undefined}>
                {rank}
                {index < RANKS.length - 1 ? (
                  <span className="ledger__dot" aria-hidden="true">
                    ·
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          <p className="muted mt-4">
            A rank is what the case cost you: the minutes your hints added, and {MISSED_ACCUSATION_MINUTES} more for
            every accusation that missed. The clock is recorded beside it and does not change it.
          </p>

          <dl className="mono mt-7 grid grid-cols-2 border-l border-t border-line md:grid-cols-4">
            {ledger.map(([term, value]) => (
              <div key={term} className="border-b border-r border-line bg-void px-3 py-3 md:px-4">
                <dt className="muted">{term}</dt>
                <dd className="mt-1 text-paper">{value}</dd>
              </div>
            ))}
          </dl>
        </Frame>
      </Reveal>
    </Section>
  );
}

function Uncatalogued() {
  return (
    <div className="measure flex flex-1 items-center justify-center py-24">
      <Frame label="Not catalogued" className="w-full max-w-xl px-6 py-10 text-center" role="status">
        <p className="mono mono--lg text-paper">The wall has not been hung yet</p>
        <p className="muted mt-3">You have earned this page, but the archive holds no photographs for it.</p>
        {process.env.NODE_ENV !== 'production' ? (
          <p className="mono muted mt-6">Developer note: seed the database. npm run seed:emulator</p>
        ) : null}
      </Frame>
    </div>
  );
}
