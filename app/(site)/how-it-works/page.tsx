import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Arrow } from '@/components/site/Arrow';
import { PageHead } from '@/components/site/PageHead';
import { SITE } from '@/lib/site/brand';
import { ASHGROVE } from '@/lib/site/catalogue';

export const metadata: Metadata = {
  title: 'How it works',
  description: `How an escape room on ${SITE.name} is played: what you need, how your place is kept, what help there is and what it costs.`,
};

const STEPS: ReadonlyArray<{ head: string; body: ReactNode }> = [
  {
    head: 'Pick a room from the corridor.',
    body: 'The home page lists every room. An open room has a button. A sealed one has a seal, and it stays sealed until the room behind it is finished.',
  },
  {
    head: 'Read its front page.',
    body: 'Every room begins with a page anyone can read: where you are, what happened there and what the rules are. The rules belong to the room. They are not the same from one room to the next.',
  },
  {
    head: 'Get through the door.',
    body: 'The way in is the first lock. Nothing you need for it is anywhere but on that front page.',
  },
  {
    head: 'Work through what is inside.',
    body: 'A room gives you things to read and things to look at, and something to work out from them. Prove you have worked it out and the next part opens. A wrong answer costs you nothing but the guess.',
  },
  {
    head: 'Leave when you like.',
    body: 'Your place is saved every time a lock opens. Close the tab. The room will be where you left it.',
  },
  {
    head: 'Reach the end.',
    body: 'A room has an ending. It tells you how you did, and what the help you took cost you.',
  },
];

const QUESTIONS: ReadonlyArray<{ ask: string; answer: ReactNode }> = [
  {
    ask: 'Do I need an account?',
    answer: (
      <>
        <p>
          No. When you start a room, your browser is given a private key so the room can find your place again. You
          are not asked for an email address or a password. A room may ask what to call you. Any name will do.
        </p>
        <p>
          Inside {ASHGROVE.title} you can choose to link a Google account. That is only so you can pick your file up
          on another device.
        </p>
      </>
    ),
  },
  {
    ask: 'Does it cost anything?',
    answer: <p>No. {ASHGROVE.title} is free to play.</p>,
  },
  {
    ask: 'Can I play on a phone?',
    answer: (
      <p>
        Yes. The rooms are built to work on a phone. There is a lot to read, so a tablet or a computer is more
        comfortable.
      </p>
    ),
  },
  {
    ask: 'Can I play with other people?',
    answer: (
      <p>
        The rooms are written for one screen. Put as many heads around it as you like. Your place belongs to the
        browser, so everyone at that screen shares one file.
      </p>
    ),
  },
  {
    ask: 'How long does a room take?',
    answer: (
      <p>
        As long as you give it. Nothing counts down, and you do not have to finish in one sitting. {ASHGROVE.title}{' '}
        has seven rooms and a final accusation. It keeps a clock so you can see how long you took, but the clock never
        runs out.
      </p>
    ),
  },
  {
    ask: 'What if I am stuck?',
    answer: (
      <p>
        Each room says what help it offers and what the help costs. In {ASHGROVE.title} every room has three hints,
        from a nudge to the answer itself, and each one adds minutes to your time.
      </p>
    ),
  },
  {
    ask: 'Is my place saved?',
    answer: (
      <p>
        Yes, as you go, against the key in your browser. If you clear your browser’s data for this site, or play in a
        private window, the key goes and your place goes with it, unless you linked an account first.
      </p>
    ),
  },
  {
    ask: 'Can I use a keyboard or a screen reader?',
    answer: (
      <p>
        This website and {ASHGROVE.title} can be used with a keyboard alone, and both respect a reduced-motion
        setting. Photographs and drawings carry text descriptions. Some puzzles depend on looking closely at a
        drawing. If one of them stops you, <Link href="/contact">write to us</Link>.
      </p>
    ),
  },
  {
    ask: 'May I share the answers?',
    answer: <p>We would rather you did not. A room only works once for each person who walks into it.</p>,
  },
  {
    ask: 'Something is broken.',
    answer: (
      <p>
        <Link href="/contact">Tell us</Link>. Say which room, what you typed and what happened.
      </p>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHead
        label="How it works"
        title={
          <>
            Read. Think. <em>Open.</em>
          </>
        }
      >
        <p>
          An escape room here is a run of locked pages. You open them in order, by working out what is in front of
          you. This is everything else worth knowing before you start.
        </p>
      </PageHead>

      <section className="band" aria-labelledby="steps-title">
        <div className="wrap split">
          <div className="split__aside">
            <p className="label">Start to finish</p>
            <h2 id="steps-title" className="display display--3 mt-5">
              From the corridor to the last lock.
            </h2>
          </div>
          <ol className="steps">
            {STEPS.map((step, index) => (
              <li key={step.head} className="step">
                <span className="step__n" aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className="display display--4 mt-5">{step.head}</h3>
                <p className="mt-2 max-w-[28em] text-ink-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band" aria-labelledby="questions-title">
        <div className="wrap split">
          <div className="split__aside">
            <p className="label">Questions</p>
            <h2 id="questions-title" className="display display--3 mt-5">
              What people ask before they knock.
            </h2>
          </div>
          <div className="faq prose max-w-none">
            {QUESTIONS.map((question) => (
              <details key={question.ask}>
                <summary>
                  <span className="display display--4">{question.ask}</span>
                </summary>
                <div className="faq__answer">{question.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="band band--ink" aria-labelledby="start-title">
        <div className="wrap grid items-end gap-x-12 gap-y-8 md:grid-cols-12">
          <div className="md:col-span-8">
            <p className="label">
              File {ASHGROVE.number} · {ASHGROVE.title}
            </p>
            <h2 id="start-title" className="display display--2 mt-5">
              That is all of it. The door is open.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 md:col-span-4 md:justify-end">
            <a href={ASHGROVE.href} className="btn btn--bone">
              {ASHGROVE.enter}
              <Arrow />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
