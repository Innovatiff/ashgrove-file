import type { Metadata } from 'next';
import { Cellar } from '@/components/goldmaker/Cellar';

// The room itself. Nothing that is in the cellar is in this page: it arrives
// from Firestore once the visitor has a file, and what any of it does is
// answered by the function.

export const metadata: Metadata = {
  title: 'The cellar',
  // The inside of a room is not for search engines, whether or not its door is listed.
  robots: { index: false, follow: false },
};

export default function CellarPage() {
  return <Cellar />;
}
