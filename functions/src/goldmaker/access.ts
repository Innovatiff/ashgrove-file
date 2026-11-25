/**
 * Who may be shut in the cellar.
 *
 * Today: anyone. File 002 is free for now, and the site makes no promise
 * about later.
 *
 * This is the one place a price would be enforced. Every other thing a
 * visitor can do in the cellar needs a file, and only `enter` makes one, so a
 * check here is a check on the whole room. To charge for the room, look up
 * the visitor's entitlement here (for instance entitlements/{uid}, written by
 * a payment provider's webhook) and throw an HttpsError('permission-denied')
 * when it is missing. The front page has the matching place for a price:
 * components/goldmaker/Warrant.tsx.
 */
export async function mayEnter(uid: string): Promise<void> {
  void uid;
}
