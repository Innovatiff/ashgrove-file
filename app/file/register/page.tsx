import type { Metadata } from 'next';
import { Gate } from '@/components/gate/Gate';
import { CaseRoom } from '@/components/room/CaseRoom';

export const metadata: Metadata = { title: 'Room V' };

// Room V. The page ships no content of its own: the title, the papers and
// the question are read from rooms/register once the rules allow it.
export default function RegisterPage() {
  return (
    <Gate need="register">
      <CaseRoom room="register" />
    </Gate>
  );
}
