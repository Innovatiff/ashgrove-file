import type { Metadata } from 'next';
import Link from 'next/link';
import { Frame } from '@/components/ui/Frame';

export const metadata: Metadata = { title: 'Not in the file' };

export default function NotFound() {
  return (
    <div className="measure flex flex-1 items-center justify-center py-24">
      <Frame label="Page missing" mark="404" className="w-full max-w-xl px-6 py-12 text-center">
        <h1 className="title title--section">This page is not in the file.</h1>
        <p className="muted mt-4">Either it was never written, or someone removed it. Both happen in Ashgrove.</p>
        <Link href="/" className="btn mt-8">
          Return to the front of the file
        </Link>
      </Frame>
    </div>
  );
}
