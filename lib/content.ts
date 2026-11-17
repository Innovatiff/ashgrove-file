/**
 * The shapes of the documents the web app reads from Firestore.
 *
 * Type-only re-exports: nothing from scripts/content reaches the bundle.
 * Room content is loaded at runtime, and only once the rules allow it.
 */

export type {
  EvidenceContent,
  ExhibitImage,
  GlobalStats,
  ImageTreatment,
  RoomContent,
  RoomDocument,
  RoomFigure,
} from '@/scripts/content/types';
