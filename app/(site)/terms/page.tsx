import type { Metadata } from 'next';
import Link from 'next/link';
import { type Clause, Clauses } from '@/components/site/Clauses';
import { PageHead } from '@/components/site/PageHead';
import { LEGAL_UPDATED, SITE } from '@/lib/site/brand';

export const metadata: Metadata = {
  title: 'Terms',
  description: `The few rules that come with playing the escape rooms on ${SITE.name}.`,
};

const CLAUSES: readonly Clause[] = [
  {
    name: 'Using the site',
    body: (
      <p>
        You may read this website and play the rooms on it for your own enjoyment. By using it you agree to these
        terms. If you do not agree to them, please do not use it.
      </p>
    ),
  },
  {
    name: 'Your place',
    body: (
      <p>
        Your progress in a room is kept against an identifier in your browser. We try to keep it safe, but we cannot
        promise it will never be lost: browsers are cleared, and rooms are rebuilt. A room may be changed, reset or
        closed.
      </p>
    ),
  },
  {
    name: 'Play fair',
    body: (
      <p>
        Do not attack the site, flood it with requests, run automated guessing against a room, or try to read answers
        or other people’s files from the server. We may block access that does any of this.
      </p>
    ),
  },
  {
    name: 'Answers',
    body: (
      <p>Please do not publish the answers to a room. A room only works once for each person who walks into it.</p>
    ),
  },
  {
    name: 'Our work',
    body: (
      <p>
        The rooms and everything in them, including their stories, text, puzzles, pictures and design, are ours or are
        used with permission. You may share a link, a picture of a room’s front page or your own result. You may not
        copy a room, republish it or sell it.
      </p>
    ),
  },
  {
    name: 'No promises',
    body: (
      <p>
        The site is provided as it is. We do our best to keep it running and correct, but we do not guarantee that it
        will always be available, free of mistakes or fit for a particular purpose. As far as the law allows, we are
        not liable for loss that comes from using it.
      </p>
    ),
  },
  {
    name: 'Other services',
    body: (
      <p>
        If you choose to link a Google account inside a room, that sign-in is governed by Google’s own terms. What we
        keep, and where, is on the <Link href="/privacy">privacy page</Link>.
      </p>
    ),
  },
  {
    name: 'Changes',
    body: <p>We may change these terms. The date at the top shows when they last changed.</p>,
  },
  {
    name: 'Questions',
    body: (
      <p>
        Ask through the <Link href="/contact">contact page</Link>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHead label={`Terms · Last updated ${LEGAL_UPDATED}`} title="The rules of the house.">
        <p>
          The rooms on {SITE.name} are here to be played. These are the few rules that come with them, in plain words.
        </p>
      </PageHead>
      <Clauses clauses={CLAUSES} />
    </>
  );
}
