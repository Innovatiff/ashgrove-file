'use client';

import { useEffect, useRef, useState } from 'react';
import { Lock } from '@/components/goldmaker/Lock';
import { Photo } from '@/components/goldmaker/Photo';
import { Report } from '@/components/goldmaker/Report';
import { cx } from '@/lib/format';
import { describeFailure, tryTool } from '@/lib/goldmaker/api';
import type { CellarPlayer, ThingDef, ToolDef } from '@/lib/goldmaker/shape';
import { lockIsOpen, notesAbout, type World } from '@/lib/goldmaker/world';

/** What came of the last thing tried on a thing. */
export interface Happened {
  text: string;
  /** False when nothing in particular happened. */
  noted: boolean;
  gained: string[];
}

export interface ThingPanelProps {
  thing: ThingDef;
  world: World;
  player: CellarPlayer;
  happened: Happened | null;
  onHappened: (thing: string, happened: Happened) => void;
  onGo: (view: string) => void;
  onRead: (paper: string) => void;
  onAsk: () => void;
  /** Opens the nearer photograph to its full size. */
  onLook: () => void;
  onBack: () => void;
}

/**
 * One thing, looked at closely: what it is, a nearer photograph if there is
 * one, and whatever can be done with it. A tool is tried on it by pressing
 * that tool. What comes of it is decided by the function and said here.
 */
export function ThingPanel({ thing, world, player, happened, onHappened, onGo, onRead, onAsk, onLook, onBack }: ThingPanelProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  // Looking at a thing takes the focus to it, and makes sure it can be seen.
  useEffect(() => {
    const element = heading.current;
    if (!element) return;
    element.focus({ preventScroll: true });
    const room = window.innerHeight - element.getBoundingClientRect().top;
    if (room < 240) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollBy({ top: 240 - room, behavior: reduce ? 'auto' : 'smooth' });
    }
  }, [thing.id]);

  const lock = thing.lock && !lockIsOpen(player, thing.lock) ? world.locks.get(thing.lock) : undefined;
  const paper = thing.paper ? world.papers.find((candidate) => candidate.id === thing.paper) : undefined;
  const toolName = (id: string) => world.toolNames.get(id) ?? id;
  // What is already known about it, apart from what has only just been said.
  const notes = notesAbout(player, thing.id).filter((note) => note.text !== happened?.text);

  const use = async (tool: ToolDef) => {
    if (busy) return;
    setBusy(tool.id);
    try {
      const result = await tryTool(tool.id, thing.id);
      onHappened(thing.id, result);
    } catch (error) {
      onHappened(thing.id, { text: describeFailure(error).message, noted: false, gained: [] });
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className={cx(thing.picture && 'thing--pictured')} aria-labelledby="thing-name" data-testid={`thing-${thing.id}`}>
      {thing.picture ? (
        <button type="button" className="thing__look" onClick={onLook} aria-label={`Look closer at ${thing.name.toLowerCase()}`} data-testid="look-closer">
          <Photo picture={thing.picture} sizes="(min-width: 48rem) 300px, 92vw" className="thing__close" />
          <span aria-hidden="true">Look closer</span>
        </button>
      ) : null}

      <div>
        <h2 id="thing-name" ref={heading} tabIndex={-1} className="title title--2">
          {thing.name}
        </h2>
        <p className="mt-3 max-w-[62ch]" data-testid="thing-text">
          {thing.text}
        </p>

        <div role="status" className="mt-4" data-testid="happened">
          {happened ? (
            <div className={cx('happened', !happened.noted && 'happened--plain')}>
              <p>{happened.text}</p>
              {happened.gained.length > 0 ? <p className="brass mt-1">You now have: {happened.gained.join('. ')}.</p> : null}
            </div>
          ) : null}
        </div>

        {paper || thing.to || thing.talk ? (
          <p className="mt-5 flex flex-wrap gap-3">
            {paper ? (
              <button type="button" className="btn" onClick={() => onRead(paper.id)} data-testid="read">
                Read it
              </button>
            ) : null}
            {thing.to ? (
              <button type="button" className="btn btn--solid" onClick={() => onGo(thing.to ?? '')} data-testid="go">
                {thing.toLabel ?? 'Go'}
              </button>
            ) : null}
            {thing.talk ? (
              <button type="button" className="btn" onClick={onAsk} data-testid="ask">
                Ask the captain
              </button>
            ) : null}
          </p>
        ) : null}

        {lock ? (
          <div className="mt-6">
            <Lock lock={lock} onOpen={(text, gained) => onHappened(thing.id, { text, noted: true, gained })} />
          </div>
        ) : null}

        {thing.report ? (
          player.closedAt ? (
            <p className="happened mt-5">You have said it, and the door has been opened to you.</p>
          ) : (
            <Report player={player} />
          )
        ) : null}

        <div className="mt-6">
          <h3 className="label" id="try-label">
            Try on it
          </h3>
          <div className="tools mt-2" role="group" aria-labelledby="try-label">
            {world.tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className="btn btn--small"
                onClick={() => use(tool)}
                disabled={busy !== null}
                aria-busy={busy === tool.id}
                title={tool.text}
                data-testid={`use-${tool.id}`}
              >
                {tool.name}
              </button>
            ))}
          </div>
        </div>

        {notes.length > 0 ? (
          <div className="mt-6">
            <h3 className="label">What you know about it</h3>
            <ul className="noted mt-2">
              {notes.map((note) => (
                <li key={note.n}>
                  <span className="mute">{toolName(note.tool)}. </span>
                  {note.text}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-7">
          <button type="button" className="link" onClick={onBack} data-testid="thing-back">
            Stop looking at it
          </button>
        </p>
      </div>
    </article>
  );
}
