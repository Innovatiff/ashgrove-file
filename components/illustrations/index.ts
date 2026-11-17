import type { ComponentType } from 'react';
import { Candle } from '@/components/illustrations/Candle';
import { Clock0317 } from '@/components/illustrations/Clock0317';
import { HallElevation } from '@/components/illustrations/HallElevation';
import { Lantern } from '@/components/illustrations/Lantern';
import { Teacup } from '@/components/illustrations/Teacup';
import type { RoomFigure } from '@/lib/content';

export { Candle, Clock0317, HallElevation, Lantern, Teacup };
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
};
