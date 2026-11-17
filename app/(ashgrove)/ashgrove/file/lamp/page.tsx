import type { Metadata } from 'next';
import { Gate } from '@/components/gate/Gate';
import { CaseRoom } from '@/components/room/CaseRoom';

export const metadata: Metadata = { title: 'Room VII' };

// Room VII. The page ships no content of its own: the title, the papers and
// the question are read from rooms/lamp once the rules allow it.
export default function LampPage() {
  return (
    <Gate need="lamp">
      <CaseRoom room="lamp" />
    </Gate>
  );
}
