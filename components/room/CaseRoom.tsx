'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Clearance } from '@/components/gate/Clearance';
import { FIGURE_WIDTH, FIGURES } from '@/components/illustrations';
import { useProgress } from '@/components/providers/ProgressProvider';
import { Paper } from '@/components/room/Paper';
import { useEvidence, useRoom } from '@/components/room/useRoom';
import { WitnessCard } from '@/components/room/WitnessCard';
import { BlendImage } from '@/components/ui/BlendImage';
import { CodeInput, type CodeOutcome } from '@/components/ui/CodeInput';
import { DoubleRule } from '@/components/ui/DoubleRule';
import { EvidenceCard } from '@/components/ui/EvidenceCard';
import { Frame } from '@/components/ui/Frame';
import { HintPanel } from '@/components/ui/HintPanel';
import { Redaction } from '@/components/ui/Redaction';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { checkAnswer, describeFailure } from '@/lib/api';
import type { RoomContent } from '@/lib/content';
import { track } from '@/lib/firebase';
import { cx, hourMinute } from '@/lib/format';
import { roomOpenedAt } from '@/lib/progress';
import { isBuilt, nextRoom, ROOM_ORDER, type RoomId, roomNumeral, routeForRoom, VERDICT_ROUTE } from '@/lib/rooms';

/** How many of the three columns a paper takes. Written out so the classes exist. */
const SPAN = { 1: '', 2: 'md:col-span-2', 3: 'md:col-span-3' } as const;

/**
 * A room of the file, drawn from its Firestore document.
 *
 * Nothing about the room is written here: not its title, its papers, its
 * question or its answer. This component lays out whatever rooms/{roomId}
 * holds, sends the detective's code to checkAnswer, and shows what the
 * server says happened.
 */
export function CaseRoom({ room: roomId }: { room: RoomId }) {
  const { player, progress } = useProgress();
  const state = useRoom(roomId);
  const [typed, setTyped] = useState<string | null>(null);

  const solved = progress.solvedRooms.includes(roomId);
  const earned = useEvidence(solved ? progress.evidence : []);

  if (state.status === 'loading') return <Clearance state="checking" />;
  if (state.status === 'denied') return <Clearance state="denied" />;
  if (state.status === 'error') return <Clearance state="error" />;
  if (state.status === 'missing') return <Uncatalogued />;

  const room = state.room;
  const numeral = roomNumeral(roomId);
  const opened = roomOpenedAt(player, roomId);
  const cards = Object.entries(earned).filter(([, card]) => card.room === roomId);
  const reveal = room.redaction ? earned[room.redaction.evidence]?.reveal : undefined;
  const following = nextRoom(roomId);
  // The seventh room leads to the accusation, not to another room.
  const onward = following ? (isBuilt(following) ? routeForRoom(following) : null) : VERDICT_ROUTE;

  async function submit(code: string): Promise<CodeOutcome> {
    try {
      const result = await checkAnswer(roomId, code);
      if (!result.correct) {
        return { status: 'wrong', message: 'No. The evidence says otherwise.', triesLeft: result.triesLeft };
      }
      setTyped(code);
      void track('room_solved', { room: roomId });
      return { status: 'correct', message: 'Correct. The file has been amended.' };
    } catch (error) {
      const failure = describeFailure(error);
      return failure.retryAfterSeconds
        ? { status: 'blocked', message: failure.message, retryAfterSeconds: failure.retryAfterSeconds }
        : { status: 'error', message: failure.message };
    }
  }

  return (
    <article data-room={roomId} data-solved={solved || undefined}>
      {/* ------------------------------------------------------ header -- */}
      <header className="measure pt-12 md:pt-20">
        <Reveal>
          <p className="mono muted">
            Room {numeral} of {ROOM_ORDER.length === 7 ? 'VII' : ROOM_ORDER.length}
            {progress.badge ? (
              <>
                <span className="strip__slash" aria-hidden="true">
                  /
                </span>
                Badge {progress.badge}
              </>
            ) : null}
          </p>
          <h1 className="title title--room mt-4">{room.title}</h1>
          <p className="mono mono--lg mt-6 text-paper" data-testid="file-opened">
            File opened {opened ? hourMinute(opened) : '--:--'} by Det. {progress.detectiveName ?? 'Unassigned'}
          </p>
        </Reveal>
        {room.lede.length > 0 ? (
          <Reveal className="copy mt-8 text-paper">
            {room.lede.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </Reveal>
        ) : null}
      </header>

      {room.status === 'sealed' ? (
        <Sealed />
      ) : (
        <OpenRoom
          roomId={roomId}
          room={room}
          solved={solved}
          solvedValue={solved ? (reveal ?? typed ?? '') : null}
          reveal={solved ? reveal : undefined}
          hintsTaken={progress.hintsTaken[roomId] ?? 0}
          hintPenalty={progress.hintPenalty}
          onSubmit={submit}
        />
      )}

      {/* --------------------------------------------- what was found -- */}
      {solved && room.status === 'open' ? (
        <Section labelledBy="established-title" className="py-10 md:py-14">
          <Reveal>
            <DoubleRule id="established-title" title="Established" note="Added to your file" />
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-12">
            {cards.map(([id, card]) => (
              <Reveal key={id} className="md:col-span-7">
                <EvidenceCard variant="evidence" label={card.title} reference="On file" stamp="Evidence. It stays with you for the rest of the case.">
                  <span data-testid="evidence-body">{card.body}</span>
                </EvidenceCard>
              </Reveal>
            ))}

            {room.next ? (
              <Reveal className="md:col-span-5">
                <Frame active label="Next" className="h-full">
                  {onward ? (
                    <Link
                      href={onward}
                      className="flex h-full min-h-[132px] flex-col justify-between gap-6 px-6 pb-6 pt-9"
                      data-testid="next-room"
                    >
                      <span className="title text-3xl md:text-4xl">{room.next.label}</span>
                      <span className="mono mono--lg text-ember">Enter</span>
                    </Link>
                  ) : (
                    <div className="px-6 pb-6 pt-9">
                      <span className="title text-3xl md:text-4xl">{room.next.label}</span>
                      <p className="mono muted mt-6">Not yet released.</p>
                    </div>
                  )}
                </Frame>
              </Reveal>
            ) : null}
          </div>
        </Section>
      ) : null}
    </article>
  );
}

interface OpenRoomProps {
  roomId: RoomId;
  room: RoomContent;
  solved: boolean;
  solvedValue: string | null;
  reveal: string | undefined;
  hintsTaken: number;
  hintPenalty: number;
  onSubmit: (code: string) => Promise<CodeOutcome>;
}

function OpenRoom({ roomId, room, solved, solvedValue, reveal, hintsTaken, hintPenalty, onSubmit }: OpenRoomProps) {
  const documents = room.documents ?? [];
  const figures = room.figures ?? [];
  const exhibit = room.scene;
  const cutout = exhibit?.treatment === 'cutout' ? exhibit : null;
  // An upright object is shown narrower than an open book.
  const shape = cutout ? cutout.width / cutout.height : 1;
  const cutoutWidth = shape >= 1 ? 520 : shape > 0.6 ? 400 : 240;

  return (
    <>
      {/* ------------------------------------------------------- scene -- */}
      {exhibit && !cutout ? (
        <div className="measure mt-2 md:-mt-8">
          <Reveal className="mx-auto max-w-[1080px]">
            <BlendImage
              variant="scene"
              src={exhibit.src}
              width={exhibit.width}
              height={exhibit.height}
              alt={exhibit.alt}
              sizes="(min-width: 1128px) 1080px, 134vw"
              aspectNarrow="4 / 3"
              annotation={{
                label: exhibit.caption,
                x: exhibit.anchor?.x ?? 50,
                y: exhibit.anchor?.y ?? 60,
                side: exhibit.side ?? 'right',
                drop: 8,
                run: 36,
              }}
              priority
            />
          </Reveal>
        </div>
      ) : null}

      {/* ------------------------------------- the object and the person -- */}
      {cutout || room.witness ? (
        <div className="measure mt-12 md:mt-16">
          <div className="grid items-start gap-x-12 gap-y-16 lg:grid-cols-12">
            {cutout ? (
              <Reveal className={room.witness ? 'lg:col-span-5' : 'lg:col-span-12'}>
                <div className="mx-auto w-full" style={{ maxWidth: cutoutWidth }}>
                  <BlendImage
                    variant="cutout"
                    src={cutout.src}
                    width={cutout.width}
                    height={cutout.height}
                    alt={cutout.alt}
                    sizes={`(min-width: 640px) ${cutoutWidth}px, 86vw`}
                    annotation={{
                      label: cutout.caption,
                      x: cutout.anchor?.x ?? 50,
                      y: cutout.anchor?.y ?? 60,
                      side: cutout.side ?? 'right',
                      drop: 24,
                      run: 28,
                    }}
                    priority
                  />
                </div>
              </Reveal>
            ) : null}

            {room.witness ? (
              <Reveal className={cutout ? 'lg:col-span-7' : 'lg:col-span-9'}>
                <WitnessCard witness={room.witness} />
              </Reveal>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------------ papers -- */}
      <Section labelledBy="papers-title" className="mt-10 py-10 md:mt-12 md:py-14">
        <Reveal>
          <DoubleRule
            id="papers-title"
            title="The Papers"
            note={
              `${documents.length} ${documents.length === 1 ? 'document' : 'documents'}` +
              (figures.length > 0 ? ` · ${figures.length} ${figures.length === 1 ? 'figure' : 'figures'}` : '')
            }
          />
        </Reveal>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {documents.map((paper) => (
            <Reveal key={paper.id} className={cx(SPAN[paper.span ?? 1], paper.tall && 'md:row-span-2')}>
              <Paper paper={paper} />
            </Reveal>
          ))}
        </div>

        {figures.length > 0 ? (
          <div className={`mt-12 grid items-end gap-x-12 gap-y-10 ${figures.length > 1 ? 'md:grid-cols-2' : ''}`}>
            {figures.map((figure) => {
              const Figure = FIGURES[figure.id];
              if (!Figure) return null;
              return (
                <Reveal key={figure.id} as="figure">
                  <div className="mx-auto" style={{ maxWidth: FIGURE_WIDTH[figure.id] ?? 420 }}>
                    <Figure title={figure.alt} />
                  </div>
                  <figcaption className="mono muted mt-4 text-center">{figure.caption}</figcaption>
                </Reveal>
              );
            })}
          </div>
        ) : null}
      </Section>

      {/* ---------------------------------------------------- question -- */}
      <Section labelledBy="question-title" className="py-10 md:py-14">
        <Reveal>
          <DoubleRule id="question-title" title="The Question" note="One code opens the next room" />
        </Reveal>

        <div className="mt-10 grid items-start gap-8 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <Frame active={!solved} label={solved ? 'Answered' : 'Unanswered'} className="px-6 pb-8 pt-10 md:px-10 md:pb-10 md:pt-12">
              {room.prompt ? (
                <CodeInput
                  label={room.prompt}
                  format={room.answerFormat ?? 'text'}
                  submitLabel="Submit"
                  onSubmit={onSubmit}
                  solvedValue={solvedValue}
                />
              ) : null}

              {room.redaction ? (
                <div className="mt-6 border-t border-line pt-6">
                  <Redaction label={room.redaction.label} value={reveal} />
                </div>
              ) : null}
            </Frame>
          </Reveal>

          <Reveal className="md:col-span-5">
            <HintPanel room={roomId} taken={hintsTaken} penalty={hintPenalty} closed={solved} />
          </Reveal>
        </div>
      </Section>
    </>
  );
}

function Sealed() {
  const { progress } = useProgress();
  return (
    <div className="measure mt-12 md:mt-16">
      <Reveal className="max-w-[760px]">
        <Frame label="Sealed" className="px-6 pb-8 pt-10 md:px-10">
          <p className="text-paper">
            Nothing in this room can be opened yet. Your solved rooms, your time and your evidence are held exactly as you
            left them.
          </p>
          <Link href={routeForRoom(ROOM_ORDER[0])} className="btn mt-6">
            Go back over Room I
          </Link>
          <p className="mono muted mt-6">Rooms solved: {progress.solvedRooms.length}</p>
        </Frame>
      </Reveal>
    </div>
  );
}

function Uncatalogued() {
  return (
    <div className="measure flex flex-1 items-center justify-center py-24">
      <Frame label="Not catalogued" className="w-full max-w-xl px-6 py-10 text-center" role="status">
        <p className="mono mono--lg text-paper">This room has not been catalogued yet</p>
        <p className="muted mt-3">The door is yours to open, but the archive holds no papers behind it.</p>
        {process.env.NODE_ENV !== 'production' ? (
          <p className="mono muted mt-6">Developer note: seed the database. npm run seed:emulator</p>
        ) : null}
      </Frame>
    </div>
  );
}
