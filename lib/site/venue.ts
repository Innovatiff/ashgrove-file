import type { VenuePhotoName } from '@/lib/site/venue.generated';

/**
 * What each open room has in the photographs of the building: its key on the
 * rack behind the desk, and its door in the corridor.
 *
 * The photographs are of things, so they cannot follow the catalogue by
 * themselves. When a room opens, the reception, the corridor and the key rack
 * are retaken with its seal gone and its key on its hook, its door is
 * photographed, and it is given an entry here (docs/image-prompts.md says
 * how). A unit test fails while an open room has none.
 */
export interface RoomInThePictures {
  /** The room's key on its hook, cut from the photograph of the key rack. */
  key: VenuePhotoName;
  /** How wide the key is shown, in the form the `sizes` attribute takes. */
  keySizes: string;
  /** The room's door, standing open. */
  door: VenuePhotoName;
  /** What the photograph of the door shows, for someone who cannot see it. */
  doorAlt: string;
}

export const ROOMS_IN_THE_PICTURES: Readonly<Record<string, RoomInThePictures>> = {
  ashgrove: {
    key: 'key',
    keySizes: '(min-width: 64rem) 16vw, 40vw',
    door: 'door',
    doorAlt:
      'Door 001, a cream panelled door in a dark oak frame, standing a little open. Warm orange light comes through the gap and falls across the chequered floor of the corridor. A key with a paper tag hangs in the lock, and a wall lamp is lit beside the door.',
  },
  goldmaker: {
    key: 'key2',
    keySizes: '(min-width: 64rem) 24vw, 60vw',
    door: 'door2',
    doorAlt:
      'Door 002, an arched door of dark oak planks on black iron strap hinges, standing a little open under a brass plate that reads 002. Firelight comes through the gap and falls across the chequered floor of the corridor, and a rough stone wall can be seen inside. A paper tag hangs from the iron ring on its lock, and a wall lamp is lit beside the door.',
  },
};
