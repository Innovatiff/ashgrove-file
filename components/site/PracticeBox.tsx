'use client';

import { type FormEvent, useId, useState } from 'react';
import { Arrow } from '@/components/site/Arrow';
import { tryTheBox } from '@/lib/site/practice';

type State = { step: 'shut'; message: string | null } | { step: 'trying' } | { step: 'open' };

/**
 * The lock on the practice box. A visitor types the time the three things in
 * the lobby add up to. A wrong answer is told why it is wrong, where there is
 * something worth saying. The right one opens the box, and what is inside
 * points down the corridor.
 */
export function PracticeBox({ href, enter }: { href: string; enter: string }) {
  const id = useId();
  const [value, setValue] = useState('');
  const [state, setState] = useState<State>({ step: 'shut', message: null });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.step === 'trying') return;
    setState({ step: 'trying' });
    const attempt = await tryTheBox(value);
    setState(attempt.result === 'open' ? { step: 'open' } : { step: 'shut', message: attempt.message });
  }

  if (state.step === 'open') {
    return (
      <div className="notice" role="status" data-testid="box-open">
        <p className="stamp">Open</p>
        <p className="display display--3 mt-5">The box is open. There is a card inside.</p>
        <p className="lede mt-4 text-[1.0625rem]">
          “You read the plate. Most people do not. That is all a room here asks of you: read everything, and believe
          none of it until it adds up.”
        </p>
        {/* A plain anchor: the room has a layout of its own, so this is a full page load. */}
        <a href={href} className="btn mt-7">
          {enter}
          <Arrow />
        </a>
      </div>
    );
  }

  const message = state.step === 'shut' ? state.message : null;

  return (
    <form onSubmit={submit} noValidate data-testid="box-form">
      <div className="lockform">
        <div className="field">
          <label htmlFor={`${id}-time`} className="label">
            When did they go in
          </label>
          <input
            id={`${id}-time`}
            name="time"
            className="input"
            inputMode="numeric"
            autoComplete="off"
            placeholder="HH:MM"
            maxLength={5}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-describedby={`${id}-said`}
          />
        </div>
        <button type="submit" className="btn" disabled={state.step === 'trying'}>
          Try the box
        </button>
      </div>
      <p id={`${id}-said`} className="field__error mt-4 min-h-[1.6em]" role="status" data-testid="box-said">
        {message}
      </p>
    </form>
  );
}
