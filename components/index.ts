/**
 * The kit every room is built from.
 *
 *   import { Frame, DoubleRule, EvidenceCard, CodeInput } from '@/components';
 */

export { Frame, type FrameProps } from '@/components/ui/Frame';
export { DoubleRule, type DoubleRuleProps } from '@/components/ui/DoubleRule';
export { Section, type SectionProps } from '@/components/ui/Section';
export { FileLabel } from '@/components/ui/FileLabel';
export { BlendImage, type Annotation, type BlendImageProps } from '@/components/ui/BlendImage';
export { PinnedPhoto, type PinnedPhotoProps } from '@/components/ui/PinnedPhoto';
export { Reveal, type RevealProps } from '@/components/ui/Reveal';
export { EvidenceCard, type EvidenceCardProps } from '@/components/ui/EvidenceCard';
export { Redaction, type RedactionProps } from '@/components/ui/Redaction';
export { CodeInput, type CodeInputProps, type CodeOutcome } from '@/components/ui/CodeInput';
export { HintPanel, type HintPanelProps } from '@/components/ui/HintPanel';
export { LedgerFooter } from '@/components/ui/LedgerFooter';
export { SiteHeader } from '@/components/ui/SiteHeader';
export { LiveClock } from '@/components/ui/LiveClock';

export {
  AlphabetStrip,
  Boardwalk,
  Candle,
  Clock0317,
  Dipstick,
  FIGURES,
  FoxgloveSheet,
  HallElevation,
  Illustration,
  Lantern,
  Teacup,
} from '@/components/illustrations';
export { Paper } from '@/components/room/Paper';
export { WitnessCard } from '@/components/room/WitnessCard';

export { Gate, type GateProps } from '@/components/gate/Gate';
export { useAuth } from '@/components/providers/AuthProvider';
export { useProgress } from '@/components/providers/ProgressProvider';
