/**
 * Whether door 002 is open on the main website.
 *
 * While this is false the room is live at its own address and can be played
 * by anyone who has the link, but nothing points to it: the main website
 * shows its door sealed, it is not in the sitemap, and its pages ask search
 * engines not to list them.
 *
 * To open the door, set this to true, give the room an entry in
 * lib/site/catalogue.ts, and retake the three photographs of the venue that
 * show door 002 sealed (see "Opening a sealed door" in README.md).
 */
export const LISTED = false;
