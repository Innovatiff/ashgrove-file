import type { Metadata } from 'next';
import { Gate } from '@/components/gate/Gate';
import { CaseRoom } from '@/components/room/CaseRoom';

export const metadata: Metadata = { title: 'Room II' };

// Room II. The page ships no content of its own: the title, the papers and
// the question are read from rooms/coroner once the rules allow it.
export default function CoronerPage() {
  return (
    <Gate need="coroner">
      <CaseRoom room="coroner" />
    </Gate>
  );
}
