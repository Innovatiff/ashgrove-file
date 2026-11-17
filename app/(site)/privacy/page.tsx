import type { Metadata } from 'next';
import Link from 'next/link';
import { type Clause, Clauses } from '@/components/site/Clauses';
import { PageHead } from '@/components/site/PageHead';
import { LEGAL_UPDATED, SITE } from '@/lib/site/brand';
import { ASHGROVE } from '@/lib/site/catalogue';

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
          print. They do not make an account for you, they set no cookies and they run no analytics.
        </p>
        <p>
          The home page asks our database one anonymous question: how many people have gone into {ASHGROVE.title},
          and how many have finished it.
        </p>
      </>
    ),
  },
  {
    name: 'When you play a room',
    body: (
      <>
        <p>A room has to remember your place. When you open {ASHGROVE.title}:</p>
        <ul>
          <li>
            <strong>An anonymous account is made for your browser.</strong> It is a random identifier with no name
            and no email address attached, issued by Firebase Authentication, a Google service. It is stored in your
            browser. It is how the room finds your file again.
          </li>
          <li>
            <strong>A file is kept under that identifier.</strong> It holds the name you choose to sign with, a badge
            number, which rooms you have solved and when, which hints you have taken, how many guesses you have made
            in the last minute, the accusations you have made and when you finished.
          </li>
          <li>
            <strong>Some events are counted with Google Analytics</strong> once you are through the door: that a room
            was solved, that a hint was taken, that an accusation was made. Google Analytics sets cookies in your
            browser to tell one visitor from another. We use it to see where people get stuck. We do not use it for
            advertising.
          </li>
        </ul>
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
        read it and answer it. If your browser has a file in a room, the badge number and name on that file are
        attached, so that we can find it if you ask us about it. To slow down abuse, sending a message gives your
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
          <Link href="/contact">contact page</Link>. Tell us the name and badge number on your file so that we can
          find it.
        </li>
        <li>
          <strong>Clearing this site’s data in your browser</strong> removes the identifier from your device. Unless
          you linked a Google account, the file it pointed to can then no longer be opened by anyone, but it stays in
          our database until we delete it. Ask, and we will.
        </li>
        <li>
          <strong>You can block Google Analytics</strong> in your browser’s settings or with a content blocker. The
          rooms work without it.
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
