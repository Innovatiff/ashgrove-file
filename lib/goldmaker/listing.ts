/**
 * Whether door 002 is open on the main website.
 *
 * It is. The room is in the catalogue (lib/site/catalogue.ts) and so in the
 * sitemap, its front page may be listed by search engines, and the
 * photographs of the building show its key on its hook and its door open.
 *
 * While this was false the room was live at its own address and could be
 * played by anyone who had the link, but nothing pointed to it. To seal the
 * door again, set this to false and take the room back out of the catalogue.
 * A unit test fails if the two disagree. "Opening a sealed door" in README.md
 * is the whole list, for the next room.
 */
export const LISTED = true;
