# The Ashgrove File

A browser-based murder-mystery escape room. Players enter a sealed 1949 case
archive, solve one code per room, and finally accuse the killer.

![The Threshold](docs/screenshots/threshold-hero.jpg)

This is the foundation: the landing page (the Threshold), the Oath, Room I
(The Study), a stub for Room II, and all the machinery the other rooms will
stand on. More screenshots are in [`docs/screenshots`](docs/screenshots).

| Route | What it is |
| --- | --- |
| `/` | The Threshold. Hero, the legend, the victim, the rules of entry, the recruitment letter and the door. |
| `/oath` | Name, promise, badge. Optional Google link to keep the file on any device. |
| `/file/study` | Room I. Its papers, figures, question and hints are read from Firestore. |
| `/file/coroner` | Room II. A sealed stub, reachable only after Room I is solved. |

## Stack

- **Next.js 16** (App Router) + TypeScript + **Tailwind CSS 4**, built as a
  static export (`output: 'export'`, `images: { unoptimized: true }`). No API
  routes, no middleware.
- **Firebase**: Hosting, Authentication, Cloud Firestore, Cloud Functions
  (2nd gen, TypeScript) and Analytics. Project id `ashgrove-file`.
- All server logic is three callable Cloud Functions. The browser never
  writes to Firestore.

## Requirements

| | |
| --- | --- |
| Node.js | **22** recommended (it matches the Functions runtime). 20.19+ also runs the site and the tests. |
| Java | **21 or newer**, for the Emulator Suite. |
| Firebase plan | **Blaze**, to deploy Cloud Functions. The emulators need no plan and no login. |

## Run it locally on the emulators

```bash
npm install
```

```bash
npm --prefix functions install
```

```bash
cp answers.example.json answers.json
```

Fill in `answers.json` (see [Seeding](#seeding-answers-and-room-content)). Then,
in one terminal:

```bash
npm run emulators:hosting
```

That compiles the functions, builds the site pointed at the emulators, and
starts Auth, Firestore, Functions and Hosting. When it prints
`All emulators ready`, seed the database from a second terminal:

```bash
npm run seed:emulator
```

| | |
| --- | --- |
| The site | http://127.0.0.1:5002 |
| Emulator UI | http://127.0.0.1:4000 |

Emulator data lives in memory. Seed again after every restart.

### With hot reload

`next dev` talks to the emulators by default (`.env.development`), never to
production.

```bash
npm run emulators
```

```bash
npm run seed:emulator
```

```bash
npm run dev
```

Then open http://localhost:3000. To point `next dev` at the live project
instead, create `.env.development.local` containing
`NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false`.

## Seeding answers and room content

`scripts/seed.ts` uses the Admin SDK and writes four things:

| Collection | Source | Contents |
| --- | --- | --- |
| `answers/{gate}` | `answers.json` | SHA-256 of the normalised answer, the three hint texts, the ids of the evidence the gate awards |
| `evidence/{id}` | `answers.json` | What a solved room gives up, including the text behind the redaction bar |
| `rooms/{roomId}` | `scripts/content/rooms.ts` | Title, papers, figures, prompt, image name and size |
| `stats/global` | | `{ entered: 0, closed: 0 }`, created only if missing. Seeding never resets live counters. |

`answers.json` is **git-ignored**. It is the only place the codes exist outside
Firestore. Its shape is in `answers.example.json`:

```json
{
  "threshold": { "answer": "the word on the door" },
  "study": {
    "answer": "HH:MM",
    "hints": ["cheapest", "middle", "the answer itself"],
    "evidence": [
      { "id": "study-time-of-death", "title": "Time of death", "body": "One line.", "reveal": "HH:MM" }
    ]
  }
}
```

The seed validates everything before it writes: three hints per room, every
open room has an answer, every redaction points at evidence that exists, and
no room document contains its own answer in plain text.

**Emulator**

```bash
npm run seed:emulator
```

**Production**

```bash
npm run seed:prod
```

Production needs credentials with write access to Firestore. Either sign in
once with `gcloud auth application-default login`, or point
`GOOGLE_APPLICATION_CREDENTIALS` at a service account key (keep the key out of
the repository: `serviceAccount*.json` is git-ignored). The script asks you to
type the project id before it writes. `--dry-run` validates and writes nothing.

## Tests

```bash
npm test
```

| Command | What it proves |
| --- | --- |
| `npm run test:unit` | Answer normalisation and hashing. The room order in `firestore.rules` matches the code. |
| `npm run test:rules` | 34 tests with `@firebase/rules-unit-testing`: a player cannot read a locked room, cannot read answers, cannot write their own progress. |
| `npm run test:functions` | 22 tests driving `checkAnswer`, `signOath` and `takeHint` through the emulators as a browser would: room order, ten tries a minute, unique badges, hint tiers and penalties. |
| `npm run check:bundle` | After a build: no code, hint, evidence or room paper appears anywhere in `/out`. |
| `npm run verify` | Typecheck, lint, all tests, a production build and the bundle check. |

## Deploy

One-time setup in the Firebase console for `ashgrove-file`:

1. **Authentication → Sign-in method**: enable **Anonymous** and **Google**.
2. **Firestore**: note the database location, then set the matching region in
   [`functions/src/config/region.ts`](functions/src/config/region.ts). It is the
   only place the region is set. The web app reads the same constant.
3. **Billing**: the project must be on the **Blaze** plan.

Then:

```bash
npx firebase login
```

```bash
npx firebase deploy --only firestore:rules,firestore:indexes
```

```bash
npx firebase deploy --only functions
```

```bash
npm run seed:prod
```

```bash
npx firebase deploy --only hosting
```

`deploy --only hosting` runs `npm run build` and `npm run check:bundle` first
(a predeploy hook in `firebase.json`), so it always ships a fresh production
build and refuses to ship one that leaks.

## How the game is protected

Client-side gating exists (`<Gate>`), but it is a courtesy. The locks are on
the server.

```
browser ──reads──▶ Firestore   (firestore.rules decides what is visible)
browser ──calls──▶ checkAnswer / signOath / takeHint   (the only writers)
```

**Data model**

| Path | Read by clients | Written by |
| --- | --- | --- |
| `players/{uid}` | Its owner only, one document at a time | Functions only |
| `rooms/{roomId}` | Only when the requester's `players` doc shows the room before it solved | Seed script |
| `evidence/{id}` | Only when the id is already in the requester's `players.evidence` | Seed script |
| `answers/{gate}` | Never | Seed script |
| `badges/{badge}` | Never | `signOath` |
| `stats/global` | Everyone | Functions only |

`players/{uid}` holds `detectiveName`, `badge`, `oathAt`,
`solved { gate: timestamp }`, `evidence [ids]`, `hintPenalty` (minutes),
`hintsTaken { room: tier }`, `accusationsLeft` and
`attempts { gate: { count, windowStart } }`.

Two collections go beyond the original four, both for a reason:

- **`evidence`**: the card a solved room awards contains the answer. Stored in
  `rooms/study` it would be readable before the room is solved, so it lives in
  its own collection that opens only once the function has added its id to the
  player's file.
- **`badges`**: a badge is unique because it is reserved as its own document
  inside the same transaction that assigns it.

**Functions** (`functions/src/handlers`)

| Callable | What it does |
| --- | --- |
| `checkAnswer({ room, answer })` | Normalises the answer (uppercase, spaces and punctuation stripped, times kept as `HH:MM`), compares its SHA-256 with `answers/{room}.hash`. Enforces room order and 10 tries per room per minute. On success writes the solved timestamp and evidence ids and returns the next route. Never returns an answer or a hash. |
| `signOath({ name })` | Requires the Threshold solved. Cleans the name, assigns a unique `ASH-XXXX` badge, writes the oath, increments `stats.entered`. Signing twice changes nothing. |
| `takeHint({ room, tier })` | Tiers in order only. Returns the hint text and adds 5, 10 or 20 minutes. Re-reading a hint already taken is free. |

## The design system

Tokens are CSS variables in [`app/globals.css`](app/globals.css), mirrored into
the Tailwind theme. The default Tailwind palette, shadows and blurs are
removed, so the nine tokens are the only colours a utility class can reach.

| Token | Value | Use |
| --- | --- | --- |
| `--void` | `#050505` | Page background |
| `--panel` | `#0D0D0D` | Panels |
| `--grid` | `#1A1A1A` | The 48px hairline grid |
| `--line` | `#2E2E2E` | Borders and rules |
| `--line-strong` | `#4A4A4A` | Line illustrations, active borders |
| `--muted` | `#7A7A7A` | Meta text |
| `--paper` | `#C9C5BD` | Body text |
| `--ember` | `#FF6A1A` | Key words, codes, CTAs, the lamp, progress |
| `--ember-dim` | `#7A3410` | Solved and disabled states |

Hard rules, kept by leaving things out: no glow, text-shadow, box-shadow,
blur, gradients, parallax, flicker, cursor effects or typewriter effects. The
only gradient functions in the project are the masks on scene images, and the
background grid is an SVG tile, not a gradient. The only motion is `<Reveal>`
and the one-time stroke drawing of illustrations, both off under
`prefers-reduced-motion`.

### Components

Everything a later room needs is exported from `@/components`.

| Component | What it is |
| --- | --- |
| `Frame` | The one-pixel frame with corner tick marks. `tone`, `active`, `label`, `mark`, `ticks`, `as`. |
| `DoubleRule` | A section title on two one-pixel lines, three pixels apart. `title`, `index`, `note`. |
| `Section` | A band held to the measure with registration crosshairs at its corners. |
| `FileLabel` | `FILE 001 / ASHGROVE / SEALED 14.XI.1949 / DET. {NAME}`. |
| `BlendImage` | `variant="cutout"`: transparent image straight on the page. `variant="scene"`: dissolves through a mask (`ellipse`, `fade`, `aspect`, `aspectNarrow`, `focus`). `annotation` adds a mono label on a leader line. |
| `PinnedPhoto` | Portraits only: framed, tilted, pinned, captioned. |
| `Reveal` | Opacity and 16px, 700ms, once, 80ms stagger for siblings. |
| `EvidenceCard` | A framed case document in Special Elite. `variant="evidence"` for what the detective has established. |
| `Redaction` | `Time of death: ████`, lifting to the value in orange. |
| `CodeInput` | Labelled mono input and submit. `format="time"` sets digits as `HH:MM`. Reports wrong, blocked and error states. |
| `HintPanel` | Three tiers, one at a time, each behind a confirmation. |
| `LedgerFooter` | Rooms, time on file, accusations, and the live global counters. |
| `HallElevation`, `Lantern`, `Clock0317`, `Teacup`, `Candle` | Line illustrations. One part of each may be orange. |
| `Illustration` | The wrapper to build more: one-pixel strokes that draw once on entering view. |
| `Gate` | Client-side gating: `need="threshold" \| "oath" \| roomId`. |
| `CaseRoom` | Lays out any room from its Firestore document. |

## Adding the next room

1. Write the room in [`scripts/content/rooms.ts`](scripts/content/rooms.ts)
   with `status: 'open'`. Nothing in it may give the code away.
2. Add its entry to `answers.json`: answer, three hints, evidence.
3. Add `app/file/{room}/page.tsx`. Two lines if the standard layout suits:

   ```tsx
   <Gate need="coroner">
     <CaseRoom room="coroner" />
   </Gate>
   ```

   Or compose the kit by hand for a room that needs its own layout.
4. Add the room id to `BUILT_ROOMS` in [`lib/rooms.ts`](lib/rooms.ts).
5. Seed.

Room ids and their order live in
[`functions/src/config/game.ts`](functions/src/config/game.ts). `firestore.rules`
carries its own copy (rules cannot import code) and a unit test fails if the
two disagree.

## Images

All fifteen were generated with Higgsfield. Every final prompt, the model, the
job ids and the reason each variation was kept are in
[`docs/image-prompts.md`](docs/image-prompts.md).

Full-size sources are not in the repository. To reprocess one, put its PNG at
`.image-src/{name}.png` and run:

```bash
npm run images -- --only {name}
```

## File tree

```
app/
  layout.tsx                 fonts, metadata, header, ledger, providers
  globals.css                tokens and every primitive
  page.tsx                   the Threshold
  oath/page.tsx              the Oath
  file/study/page.tsx        Room I
  file/coroner/page.tsx      Room II (sealed stub)
  not-found.tsx
components/
  index.ts                   everything exposed for later rooms
  ui/                        Frame, DoubleRule, Section, FileLabel, BlendImage,
                             PinnedPhoto, Reveal, EvidenceCard, Redaction,
                             CodeInput, HintPanel, LedgerFooter, SiteHeader,
                             LiveClock, TabTitle
  illustrations/             Illustration, HallElevation, Lantern, Clock0317,
                             Teacup, Candle
  providers/                 AuthProvider (anonymous sign-in), ProgressProvider
  gate/                      Gate, Clearance
  threshold/                 HeroActions, Door
  oath/                      OathForm, KeepFile (Google link)
  room/                      CaseRoom, useRoom, useEvidence
lib/
  firebase.ts                one initialisation; analytics after isSupported()
  api.ts                     the three callables, as the browser calls them
  progress.ts                players/{uid} read into what the interface needs
  rooms.ts                   room order and routes (ids only)
  clock.ts  format.ts  content.ts  public-images.generated.ts
functions/
  src/index.ts
  src/handlers/              checkAnswer, signOath, takeHint
  src/lib/                   answers (normalise + hash), player, validate, options
  src/config/                game.ts (room order, limits), region.ts
scripts/
  seed.ts                    answers, evidence, rooms, stats
  check-bundle.ts            fails if anything secret is in /out
  process-images.mjs         sources to 2400px WebP
  content/                   rooms.ts, types.ts, images.generated.json
tests/
  unit/  rules/  functions/
docs/
  image-prompts.md
  screenshots/
public/images/               fifteen .webp files
firebase.json  .firebaserc  firestore.rules  firestore.indexes.json
answers.example.json         the shape of the git-ignored answers.json
.env.local                   Firebase web config (public identifiers)
.env.development             next dev talks to the emulators
```

## Things worth knowing

- **Functions run on Node 22, not Node 20.** Google decommissioned the Node 20
  runtime for Cloud Functions on 30 October 2026, and `firebase-tools` refuses
  to deploy it. The runtime is set by `engines.node` in `functions/package.json`.
- **SDK versions are held one major back on purpose.** `firebase` 12,
  `firebase-admin` 13 and `@firebase/rules-unit-testing` 5 are the newest lines
  that still run on Node 20 and 22. Their successors require Node 24.
- **`.env.local` is tracked.** It holds only the Firebase web config, which is
  public by design and readable in the shipped bundle. Nothing secret belongs
  in it.
- **Rooms III to VII have provisional ids** (`herbarium`, `journal`, `register`,
  `marsh`, `lamp`), inferred from the exhibit set. Rename them in
  `functions/src/config/game.ts` and `firestore.rules` before building them.
- **First load is about 390 KB of JavaScript, gzipped,** roughly half of it the
  Firebase SDK. The pages are prerendered, so content paints without it.
  Loading Firebase after first paint is the obvious next optimisation.
- **Before a public launch**, turn on App Check for the functions and restrict
  the web API key to your domains. The per-player rate limit stops one
  detective guessing fast. It does not stop one person opening many files.
