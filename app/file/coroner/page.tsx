import type { Metadata } from 'next';
import { Gate } from '@/components/gate/Gate';
import { CaseRoom } from '@/components/room/CaseRoom';

export const metadata: Metadata = { title: 'Room II' };

// Room II. A stub for now: rooms/coroner is seeded as "sealed", so a
// detective who solves Room I arrives somewhere real, and one who has not
// is turned back by the gate and refused by the rules.
export default function CoronerPage() {
  return (
    <Gate need="coroner">
      <CaseRoom room="coroner" />
    </Gate>
  );
}
