import type { ComponentType } from 'react';
import { AlphabetStrip } from '@/components/illustrations/AlphabetStrip';
import { Boardwalk } from '@/components/illustrations/Boardwalk';
import { Candle } from '@/components/illustrations/Candle';
import { Clock0317 } from '@/components/illustrations/Clock0317';
import { Dipstick } from '@/components/illustrations/Dipstick';
import { FoxgloveSheet } from '@/components/illustrations/FoxgloveSheet';
import { HallElevation } from '@/components/illustrations/HallElevation';
import { Lantern } from '@/components/illustrations/Lantern';
import { Teacup } from '@/components/illustrations/Teacup';
import type { RoomFigure } from '@/lib/content';

export { AlphabetStrip, Boardwalk, Candle, Clock0317, Dipstick, FoxgloveSheet, HallElevation, Lantern, Teacup };
export { Illustration } from '@/components/illustrations/Illustration';

export interface FigureProps {
  className?: string;
  title?: string;
}

/**
 * Room documents in Firestore name a figure by id. This is where an id
 * becomes a drawing. Add a line here when a new illustration is built.
 */
export const FIGURES: Record<RoomFigure['id'], ComponentType<FigureProps>> = {
  teacup: Teacup,
  candle: Candle,
  lantern: Lantern,
  'clock-0317': Clock0317,
  'hall-elevation': HallElevation,
  'foxglove-sheet': FoxgloveSheet,
  alphabet: AlphabetStrip,
  boardwalk: Boardwalk,
  dipstick: Dipstick,
};

/**
 * How wide a figure may grow, in pixels. A plan stood on end is drawn
 * narrower than a rule laid on its side.
 */
export const FIGURE_WIDTH: Partial<Record<RoomFigure['id'], number>> = {
  'foxglove-sheet': 340,
  boardwalk: 380,
  alphabet: 520,
  dipstick: 520,
};
