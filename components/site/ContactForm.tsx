'use client';

import { type FormEvent, useId, useRef, useState } from 'react';
import { Arrow } from '@/components/site/Arrow';
import {
  checkDraft,
  CONTACT_TOPICS,
  type ContactDraft,
  type ContactErrors,
  describeSendFailure,
  MAX_CONTACT_EMAIL,
  MAX_CONTACT_MESSAGE,
  MAX_CONTACT_NAME,
  sendMessage,
  TOPIC_LABELS,
} from '@/lib/site/contact';

const EMPTY: ContactDraft = { name: '', email: '', topic: '', message: '', website: '' };

type Status = { step: 'idle' } | { step: 'sending' } | { step: 'sent' } | { step: 'failed'; message: string };

/**
 * The contact form. It checks what it can before sending, and the
 * sendMessage function checks all of it again. The message goes into an
 * inbox no browser can read.
 */
export function ContactForm() {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState<ContactDraft>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ step: 'idle' });

  const set = (key: keyof ContactDraft) => (event: { target: { value: string } }) => {
    setDraft((current) => ({ ...current, [key]: event.target.value }));
    if (key in errors) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.step === 'sending') return;

    const found = checkDraft(draft);
    setErrors(found);
    const first = (['name', 'email', 'topic', 'message'] as const).find((key) => found[key]);
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setStatus({ step: 'sending' });
    try {
      // A filled-in trap is a script. It is thanked and nothing is sent.
      if (draft.website.trim().length === 0) await sendMessage(draft);
      setDraft(EMPTY);
      setStatus({ step: 'sent' });
    } catch (error) {
      setStatus({ step: 'failed', message: describeSendFailure(error) });
    }
  }

  if (status.step === 'sent') {
    return (
      <div className="notice" role="status" data-testid="contact-sent">
        <p className="display display--3">It is on the desk.</p>
        <p className="mt-3 text-ink-2">Thank you. We read everything, and we answer when an answer is needed.</p>
        <button type="button" className="btn btn--ghost mt-6" onClick={() => setStatus({ step: 'idle' })}>
          Write another
        </button>
      </div>
    );
  }

  const describedBy = (key: keyof ContactErrors, hint?: boolean) =>
    [errors[key] ? `${id}-${key}-error` : null, hint ? `${id}-${key}-hint` : null].filter(Boolean).join(' ') || undefined;

  return (
    <form ref={form} onSubmit={submit} noValidate className="grid gap-6" data-testid="contact-form">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="field">
          <label htmlFor={`${id}-name`} className="label">
            Your name
          </label>
          <input
            id={`${id}-name`}
            name="name"
            className="input"
            autoComplete="name"
            maxLength={MAX_CONTACT_NAME}
            value={draft.name}
            onChange={set('name')}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy('name')}
          />
          {errors.name ? (
            <p id={`${id}-name-error`} className="field__error">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor={`${id}-email`} className="label">
            Email address
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            inputMode="email"
            className="input"
            autoComplete="email"
            maxLength={MAX_CONTACT_EMAIL}
            value={draft.email}
            onChange={set('email')}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy('email', true)}
          />
          {errors.email ? (
            <p id={`${id}-email-error`} className="field__error">
              {errors.email}
            </p>
          ) : null}
          <p id={`${id}-email-hint`} className="field__hint">
            Only used to answer you.
          </p>
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${id}-topic`} className="label">
          What is it about
        </label>
        <select
          id={`${id}-topic`}
          name="topic"
          className="input"
          value={draft.topic}
          onChange={set('topic')}
          aria-invalid={errors.topic ? true : undefined}
          aria-describedby={describedBy('topic')}
        >
          <option value="">Choose one</option>
          {CONTACT_TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {TOPIC_LABELS[topic]}
            </option>
          ))}
        </select>
        {errors.topic ? (
          <p id={`${id}-topic-error`} className="field__error">
            {errors.topic}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor={`${id}-message`} className="label">
          Message
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          className="input"
          maxLength={MAX_CONTACT_MESSAGE}
          value={draft.message}
          onChange={set('message')}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describedBy('message', true)}
        />
        {errors.message ? (
          <p id={`${id}-message-error`} className="field__error">
            {errors.message}
          </p>
        ) : null}
        <p id={`${id}-message-hint`} className="field__hint">
          If something is broken, say which room, what you typed and what happened.
        </p>
      </div>

      {/* Not for people. Hidden from sight, from the keyboard and from screen readers. */}
      <div className="trap" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Leave this empty</label>
        <input
          id={`${id}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={draft.website}
          onChange={set('website')}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="submit" className="btn" disabled={status.step === 'sending'}>
          {status.step === 'sending' ? 'Sending' : 'Send it'}
          <Arrow />
        </button>
        <p className="field__error" role="alert" data-testid="contact-failed">
          {status.step === 'failed' ? status.message : null}
        </p>
      </div>
    </form>
  );
}
