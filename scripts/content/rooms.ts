import type { RoomId } from '../../functions/src/config/game';
import type { RoomContent } from './types';

/**
 * What a detective is shown inside each room, before it is solved.
 *
 * The seed script writes these to rooms/{roomId}. The web app never imports
 * this file: a room's documents reach the browser only through Firestore, and
 * only once the rules say the room is open.
 *
 * Nothing in here may give a code away. Codes, hints and the evidence a
 * solved room gives up live in answers.json, which is not in the repository.
 */

type SceneWithoutSize = Omit<NonNullable<RoomContent['scene']>, 'src' | 'width' | 'height' | 'treatment'> & {
  /** File name in /public/images, without the extension. */
  image: string;
};

export type RoomSource = Omit<RoomContent, 'scene'> & { scene?: SceneWithoutSize };

export const ROOMS: Partial<Record<RoomId, RoomSource>> = {
  study: {
    title: 'The Study',
    status: 'open',
    lede: [
      'The tower study, as the constable left it. Nothing has been moved since.',
      'Three papers. One clock. They do not agree.',
    ],
    scene: {
      image: 'study-scene',
      alt: 'The tower study as it was found. A wooden desk covered in papers. A teacup on its side in spilled tea, with a short candle lying in the tea. An oil lamp burning on the windowsill. An empty chair pushed back from the desk.',
      caption: 'Exhibit 03 — The tower study, as found',
      // The cup on its side, in the spilled tea.
      anchor: { x: 33, y: 62 },
    },
    documents: [
      {
        id: 'maid-statement',
        label: 'Maid’s statement',
        reference: 'I-A',
        body: 'I lit the Professor’s new six-inch candle at ten o’clock, as always.',
      },
      {
        id: 'candle-box-label',
        label: 'Candle box label',
        reference: 'I-B',
        body: 'Ashgrove Chandlery — burns one inch per hour.',
      },
      {
        id: 'constable-note',
        label: 'Constable’s note',
        reference: 'I-C',
        body: 'Candle found tipped into the spilled tea, five inches remaining. Mantel clock stopped at 03:17.',
      },
    ],
    figures: [
      { id: 'teacup', caption: 'Fig. I-1 — The cup, on its side' },
      { id: 'candle', caption: 'Fig. I-2 — The candle, as found' },
    ],
    prompt: 'THE CLOCK SAYS 03:17. WHEN DID ELIAS VARN ACTUALLY DIE? (HH:MM)',
    answerFormat: 'time',
    redaction: { label: 'Time of death', evidence: 'study-time-of-death' },
    next: { label: 'Room II — The Coroner' },
  },

  coroner: {
    title: 'The Coroner',
    status: 'sealed',
    lede: [
      'You have earned this door. The papers behind it have not been released yet.',
      'Your place on the file is held. Come back.',
    ],
  },
};
