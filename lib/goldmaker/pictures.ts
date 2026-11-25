/** Where the room's pictures are served from. */
const BASE = '/cellar';

/** A picture on disk: its name, the size of its widest file, and every width there is. */
export interface Sized {
  name: string;
  width: number;
  height: number;
  widths: readonly number[];
}

/** Every width of a picture, for the browser to choose from. */
export function srcSetOf(picture: Pick<Sized, 'name' | 'widths'>): string {
  return picture.widths.map((width) => `${BASE}/${picture.name}-${width}.webp ${width}w`).join(', ');
}

/** The widest file of a picture, or the narrowest that is at least `atLeast` wide. */
export function srcOf(picture: Pick<Sized, 'name' | 'widths'>, atLeast?: number): string {
  const widths = picture.widths;
  const width = (atLeast ? widths.find((candidate) => candidate >= atLeast) : undefined) ?? widths[widths.length - 1];
  return `${BASE}/${picture.name}-${width}.webp`;
}
