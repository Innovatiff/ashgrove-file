import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/site/ContactForm';
import { PageHead } from '@/components/site/PageHead';
import { SITE } from '@/lib/site/brand';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Write to ${SITE.name}: a broken lock, a wrong word, an idea for a room, or a question about your data.`,
};

export default function ContactPage() {
  return (
    <>
      <PageHead
        label="Contact"
        title={
          <>
            Write to <em>us.</em>
          </>
        }
      >
        <p>A broken lock, a wrong word, an idea for a room, a question about your data. It all comes to one desk.</p>
      </PageHead>

      <section className="band" aria-label="Send a message">
        <div className="wrap split">
          <div className="split__aside">
            <p className="label">Before you write</p>
            <div className="prose mt-5 text-ink-2">
              <ul>
                <li>
                  <strong>Stuck in a room?</strong> Its own hints are the quickest help. They are there to be used.
                </li>
                <li>
                  <strong>Something broken?</strong> Say which room, what you typed and what happened.
                </li>
                <li>
                  <strong>About your data?</strong> The <Link href="/privacy">privacy page</Link> says what is kept.
                  Ask here and we will show it to you or delete it.
                </li>
              </ul>
            </div>
          </div>
          <div>
            <ContactForm />
            <p className="quiet mt-8 max-w-[40em] text-[0.9375rem]">
              What you send is stored so that we can read it and answer it, and for nothing else. The details are on
              the <Link href="/privacy" className="textlink">privacy page</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
