import type { Metadata } from 'next';
import { Gate } from '@/components/gate/Gate';
import { CaseRoom } from '@/components/room/CaseRoom';

export const metadata: Metadata = { title: 'Room IV' };

// Room IV. The page ships no content of its own: the title, the papers and
// the question are read from rooms/journal once the rules allow it.
export default function JournalPage() {
  return (
    <Gate need="journal">
      <CaseRoom room="journal" />
    </Gate>
  );
}
