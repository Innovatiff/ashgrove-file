import type { Metadata } from 'next';
import { Gate } from '@/components/gate/Gate';
import { CaseRoom } from '@/components/room/CaseRoom';

export const metadata: Metadata = { title: 'Room III' };

// Room III. The page ships no content of its own: the title, the papers and
// the question are read from rooms/herbarium once the rules allow it.
export default function HerbariumPage() {
  return (
    <Gate need="herbarium">
      <CaseRoom room="herbarium" />
    </Gate>
  );
}
