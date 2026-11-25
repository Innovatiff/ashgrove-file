/**
 * The Gold-Maker's ids, limits and document shapes, for the web app.
 *
 * They are defined once, in functions/src/goldmaker/shape.ts, and re-exported
 * here so the browser and the Cloud Function can never disagree. Only ids,
 * numbers and types are in the bundle. What is in the cellar comes from
 * Firestore.
 */
export {
  BASE_ROUTE,
  CALLABLE,
  CELLAR_ROUTE,
  GAME,
  HINT_MARKS,
  HINT_TIERS,
  MAX_NAME_LENGTH,
  MISSED_LOCK_MARKS,
  MISSED_REPORT_MARKS,
  RANKS,
} from '@/functions/src/goldmaker/shape';
export type {
  BookLeaf,
  CellarContent,
  CellarPlayer,
  ChartRow,
  EnterResult,
  HintResult,
  LockDef,
  Note,
  PaperDef,
  Picture,
  Rank,
  Rect,
  ReportDef,
  ReportResult,
  SetResult,
  ThingDef,
  ToolDef,
  TryResult,
  ViewDef,
} from '@/functions/src/goldmaker/shape';
