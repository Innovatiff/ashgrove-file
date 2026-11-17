/**
 * The one place the Cloud Functions region is set.
 *
 * It must match the location of the project's Firestore database, so that a
 * function and the data it reads sit in the same place.
 *
 *   Firestore location        use this region
 *   nam5 (United States)      us-central1
 *   eur3 (Europe)             europe-west1
 *   a single region           that same region, e.g. europe-west2
 *
 * Find yours in the Firebase console under Firestore Database, or run:
 *   firebase firestore:databases:get "(default)"
 *
 * This project's database is in northamerica-northeast1 (Montreal). The
 * "Check deploy setup" workflow reads the location back from Google and warns
 * if the two ever stop matching.
 *
 * The web app reads this same constant (lib/firebase.ts), so the client and
 * the functions cannot drift apart. Nothing here may import a package: this
 * file is compiled into the browser bundle too.
 */
export const REGION = 'northamerica-northeast1';
