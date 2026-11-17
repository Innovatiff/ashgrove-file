import type { Metadata } from 'next';
import { Gate } from '@/components/gate/Gate';
import { CaseRoom } from '@/components/room/CaseRoom';

export const metadata: Metadata = { title: 'Room I' };

// Room I. The page ships no content of its own: the title, the papers and
// the question are read from rooms/study once the rules allow it.
export default function StudyPage() {
  return (
    <Gate need="study">
      <CaseRoom room="study" />
    </Gate>
  );
}
