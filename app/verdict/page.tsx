import type { Metadata } from 'next';
import { Gate } from '@/components/gate/Gate';
import { Verdict } from '@/components/verdict/Verdict';

export const metadata: Metadata = { title: 'The Verdict' };

// The last page of the file. It ships no content of its own: who is on the
// wall and what each of them said are read from rooms/verdict once the
// seventh room is solved, and who did it never reaches the browser at all.
export default function VerdictPage() {
  return (
    <Gate need="verdict">
      <Verdict />
    </Gate>
  );
}
