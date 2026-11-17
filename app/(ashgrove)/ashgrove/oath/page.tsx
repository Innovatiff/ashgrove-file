import type { Metadata } from 'next';
import { Gate } from '@/components/gate/Gate';
import { OathForm } from '@/components/oath/OathForm';

export const metadata: Metadata = { title: 'The Oath' };

// Locked until the Threshold is solved. signOath enforces the same rule on
// the server, so skipping this gate gets a visitor nothing.
export default function OathPage() {
  return (
    <Gate need="threshold">
      <OathForm />
    </Gate>
  );
}
