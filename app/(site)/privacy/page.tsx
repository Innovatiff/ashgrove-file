import type { Metadata } from 'next';
import Link from 'next/link';
import { AnalyticsChoice } from '@/components/site/AnalyticsChoice';
import { type Clause, Clauses } from '@/components/site/Clauses';
import { PageHead } from '@/components/site/PageHead';
import { LEGAL_UPDATED, SITE } from '@/lib/site/brand';
import { ASHGROVE, GOLDMAKER } from '@/lib/site/catalogue';

export const metadata: Metadata = {
  title: 'Privacy',
  description: `What ${SITE.name} keeps about you, where it is kept and how to have it removed.`,
};

// Every statement on this page describes something the code does. If the
// code changes (a new field in a player's file, a new service, analytics on
// or off), change this page in the same commit, and LEGAL_UPDATED with it.

const CLAUSES: readonly Clause[] = [
  {
    name: 'Who this is',
    body: (
      <p>
        This website is run by {SITE.name}. To reach us about anything on this page, use the{' '}
        <Link href="/contact">contact page</Link>.
      </p>
    ),
  },
  {
    name: 'The main website',
    body: (
      <>
        <p>
          The pages that list and describe the rooms are the home page, About, How it works, Contact and the small
          print. They do not make an account for you, they set no cookies and they run no analytics. They keep
          nothing in your browser, unless you use the buttons further down this page to record an answer about
          analytics.
        </p>
        <p>
          The home page asks our database one anonymous question about each open room: how many people have gone
          into it, and how many have finished it.
        </p>
      </>
    ),
  },
  {
    name: 'When you play a room',
    body: (
      <>
        <p>A room has to remember your place. When you go into one:</p>
        <ul>
          <li>
            <strong>An anonymous account is made for your browser.</strong> It is a random identifier with no name
            and no email address attached, issued by Firebase Authentication, a Google service. It is stored in your
            browser. It is how a room finds your file again, and every room uses the same one. {ASHGROVE.title} makes
            it when you open its front page. {GOLDMAKER.title} makes it when you sign its warrant, and not before.
          </li>
          <li>
            <strong>A file is kept under that identifier, one for each room you go into.</strong> It holds the name
            you choose to sign with and, in {ASHGROVE.title}, a badge number. It holds what you have solved, opened
            and found in that room and when, the room’s own notes of what you tried, which hints you have taken, any
            marks written against your name, how many tries you have made in the last minute, the accusations or
            reports you have made, and when and how you finished.
          </li>
        </ul>
      </>
    ),
  },
  {
    name: 'Analytics, if you allow it',
    body: (
      <>
        <p>
          A room would like to count what happens in it: that somebody went in, that a room was solved, that a hint
          was taken, that an accusation was made or a case closed. We use the numbers to see where people get stuck. The counting is done by Google
          Analytics, which sets cookies in your browser to tell one visitor from another.
        </p>
        <p>
          It is off until you say otherwise. A room asks once, when you go through its door, and both answers are
          offered side by side. If you refuse, or do not answer, Google Analytics is never loaded: no script, no
          request and no cookie. If you allow it, it is used for measurement only, never for advertising.
        </p>
        <p>
          Your answer is kept in your browser, so that you are not asked again on every page. It is asked for again
          after a year. You can change it here at any time, or from the foot of any page in a room.
        </p>
        <AnalyticsChoice />
      </>
    ),
  },
  {
    name: 'If you link a Google account',
    body: (
      <p>
        Inside a room you can choose to link your file to a Google account, so that you can open it on another
        device. If you do, Google gives us your name, your email address and the address of your profile picture, and
        Firebase Authentication stores them with your identifier. We use them to find your file when you sign in, and
        for nothing else. We do not email you.
      </p>
    ),
  },
  {
    name: 'If you write to us',
    body: (
      <p>
        The contact form stores your name, your email address, your message and the time you sent it, so that we can
        read it and answer it. If your browser has a file in {ASHGROVE.title}, the badge number and name on that
        file are attached, so that we can find it if you ask us about it. To slow down abuse, sending a message gives your
        browser the same kind of anonymous identifier a room does.
      </p>
    ),
  },
  {
    name: 'Where it is kept',
    body: (
      <>
        <p>
          Everything is held with Google Firebase. The database is in Google’s Montréal region, in Canada. Accounts
          are held by Firebase Authentication. The website’s files are served from Google’s network, which, like any
          web host, records the internet address of each request for security.
        </p>
        <p>
          Google handles this for us under its own terms, which are set out in{' '}
          <a href="https://firebase.google.com/support/privacy" rel="noopener noreferrer">
            Privacy and Security in Firebase
          </a>
          .
        </p>
      </>
    ),
  },
  {
    name: 'How long',
    body: (
      <p>
        A file in a room is kept so that you can come back to it. There is no automatic expiry: it stays until you ask
        us to delete it. A message is kept for as long as we need it to deal with what it says.
      </p>
    ),
  },
  {
    name: 'What we do not do',
    body: (
      <p>
        We do not sell or rent what we hold about you. We do not show adverts. We do not use what we hold for
        advertising.
      </p>
    ),
  },
  {
    name: 'Your choices',
    body: (
      <ul>
        <li>
          <strong>To see or delete your file, or have a message removed,</strong> write to us through the{' '}
          <Link href="/contact">contact page</Link>. Tell us the name on your file, and its badge number if it has
          one, so that we can find it.
        </li>
        <li>
          <strong>Clearing this site’s data in your browser</strong> removes the identifier from your device. Unless
          you linked a Google account, the file it pointed to can then no longer be opened by anyone, but it stays in
          our database until we delete it. Ask, and we will.
        </li>
        <li>
          <strong>To change your answer about analytics,</strong> use the buttons under “Analytics, if you allow it”
          above. Refusing stops it at once and removes its cookies. The rooms work the same without it.
        </li>
      </ul>
    ),
  },
  {
    name: 'Children',
    body: (
      <p>
        The rooms are written for adults and older teenagers. {ASHGROVE.title} is a murder mystery. We do not
        knowingly collect information from children under 13.
      </p>
    ),
  },
  {
    name: 'Changes',
    body: <p>If what we keep changes, this page changes with it, and so does the date at the top.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHead label={`Privacy · Last updated ${LEGAL_UPDATED}`} title="What we keep, and why.">
        <p>
          The short version: the main website keeps nothing about you. A room keeps what it needs to remember your
          place. This page says exactly what that is, where it is held and how to have it removed.
        </p>
      </PageHead>
      <Clauses clauses={CLAUSES} />
    </>
  );
}
