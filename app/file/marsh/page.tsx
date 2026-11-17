import type { Metadata } from 'next';
import { Gate } from '@/components/gate/Gate';
import { CaseRoom } from '@/components/room/CaseRoom';

export const metadata: Metadata = { title: 'Room VI' };

// Room VI. The page ships no content of its own: the title, the papers and
// the question are read from rooms/marsh once the rules allow it.
export default function MarshPage() {
  return (
    <Gate need="marsh">
      <CaseRoom room="marsh" />
    </Gate>
  );
}
