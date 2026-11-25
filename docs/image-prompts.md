# Image prompts

Every image in `/public/images` was generated with the Higgsfield MCP. Nothing is
stock and nothing is a placeholder.

## Model and settings

| | |
| --- | --- |
| Model | **GPT Image 2.6** (Higgsfield id `gpt_image_2_6`) |
| Resolution | `4k` (3840 px on the long edge for 21:9, 16:9 and 9:16; 3312 px for 3:4; 3200 px for 4:5; 2880 px for 1:1) |
| Quality | `high` |
| Variations | 2 per image, 1 kept |
| Background removal | Higgsfield `remove_background` (`image_background_remover`) on all six cutouts |
| Final files | `sharp`, 2400 px on the long edge, WebP, alpha kept on cutouts |

The five suspect portraits were submitted together in one batch with identical
model, resolution, quality and aspect ratio.

### How the model was chosen

"Strongest photorealistic model" was settled by a bake-off rather than by catalog
blurbs. The hero scene and one portrait went through four candidates at 4K with
the exact prompt and style suffix below.

| Model | Result |
| --- | --- |
| `gpt_image_2_6` | Held the brief on both: true black, one flat orange source, everything else grey, real grain at 100%. **Chosen.** |
| `nano_banana_pro` | Hero came back inside a white border with pink fog. Portrait added a glowing lantern. |
| `cinematic_studio_2_5` | Very photoreal, but left visible vertical banding in the black and lit the whole face. |
| `flux_3_image` | Most documentary of the four, but kept a grey sky, natural skin colour and a teal dress. Orange was not the only colour. |

## Style suffix

Appended to every prompt, unchanged:

> cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

## Selection rules

A variation was kept only if all three held:

1. Orange is the only colour.
2. Nothing glows.
3. No text or watermark.

If neither variation passed, the image was regenerated.

Rule 1 is also measured. `scripts/process-images.mjs` reports, for each final
file, the share of pixels that carry real colour outside the orange band. Every
image in the set scores 0.03% or less.

### One judgement call: readable writing

Four prompts describe documents (a typed certificate, a notebook, a register,
annotated herbarium paper). In the first round the model wrote them out as
crisp, fully readable text: an inquest into a different death, a page of names
and dates, a cipher a player could copy down. That fails rule 3, and in a
mystery it is worse than a watermark, because a careful player will read it as
evidence.

Those four were regenerated with one added instruction: the writing is present
but too faded to read. The tin tag stamped 7 and the clock numerals were left
alone, because there the mark is the point.

If you later want a prop that says something specific, write the exact wording
into its prompt and regenerate that one image.

## Treatments

| Treatment | Meaning |
| --- | --- |
| SCENE | Generated with edges already near black, then dissolved into the page with a CSS mask. |
| CUTOUT | Any desk or surface wording replaced with "isolated object floating on pure black, no surface, no table", background removed, saved with alpha. |
| PORTRAIT | The only hard rectangles: photographs pinned to the evidence wall. |

## The set

### 1. hero-hall

| | |
| --- | --- |
| Aspect ratio | 21:9 |
| Treatment | SCENE |
| File | `/public/images/hero-hall.webp` (2400 x 1030) |
| Kept | variation B, job `9a3f6907-62a7-4883-9d39-c1af17adbfe4` |

Final prompt:

> A Victorian manor with a narrow stone tower seen from across a flat marsh at night, fog low on reeds, one small window at the top of the tower lit orange, the rest of the house black, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Why this one: Cleanest fall-off: every edge is already black, so the mask has nothing to hide. A lets bright reeds run to the left, right and bottom edges. The bake-off render (same prompt and settings) was a close third.

### 2. ember-warden

| | |
| --- | --- |
| Aspect ratio | 9:16 |
| Treatment | SCENE |
| File | `/public/images/ember-warden.webp` (1350 x 2400) |
| Kept | variation B, job `4c1f0140-f319-4f20-896e-d811566cf127` |

Final prompt:

> A faceless cloaked figure far away on a marsh boardwalk at night holding an old lantern, almost a silhouette, fog, only the lantern flame orange, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Why this one: The flame is the only orange in the frame. A throws an orange reflection down the wet boards and a warm halo beside the lantern.

### 3. study-scene

| | |
| --- | --- |
| Aspect ratio | 16:9 |
| Treatment | SCENE |
| File | `/public/images/study-scene.webp` (2400 x 1350) |
| Kept | variation B, job `a33f0494-d648-41c1-a948-ce94a21183fe` |

Final prompt:

> A cramped tower study at dawn, wooden desk covered in papers, a teacup on its side with spilled tea, a short candle tipped into the tea, an oil lamp on the windowsill burning orange, an empty chair pushed back, no people, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Why this one: Tighter flame with less halo inside the glass, and the left and top edges dissolve fully. Every prop the room needs is present: tipped cup, spilled tea, candle in the tea, lamp on the sill, empty chair.

### 4. clock-0317

| | |
| --- | --- |
| Aspect ratio | 1:1 |
| Treatment | CUTOUT |
| File | `/public/images/clock-0317.webp` (2167 x 2400, alpha) |
| Kept | variation B, job `5f7fb6d7-d8c8-41d6-b33e-e2dd29c901da` |
| Background removal | job `f00c2c2b-857b-42dc-a9ec-f15927ac25c9` |

Final prompt:

> Close-up of an old brass mantel clock stopped at 3:17, dust on the glass, lit from one side by orange lamplight, isolated object floating on pure black, no surface, no table, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Prompt edit: The prompt had no desk or surface wording to replace, so the isolation phrase was appended.

Why this one: Both variations read 3:17 (checked at full resolution: hour hand just past the 3, minute hand between the 3 and the 4). B keeps the whole clock inside the frame, which makes a cleaner cutout.

### 5. foxglove

| | |
| --- | --- |
| Aspect ratio | 4:5 |
| Treatment | CUTOUT |
| File | `/public/images/foxglove.webp` (1635 x 2400, alpha) |
| Kept | variation C (round 2), job `70c59ccf-d006-4bee-9626-eaaa8357534c` |
| Background removal | job `6e124ddd-fe24-450d-ba44-77696b7fd9f7` |

Final prompt:

> A pressed foxglove stem on yellowed herbarium paper, ink annotations in the margin, lit by a single orange lamp outside the frame, isolated object floating on pure black, no surface, no table, the ink annotations faded and illegible, no readable words, the pressed flowers dried to grey, the whole sheet inside the frame with a wide black margin on every side, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Prompt edit: "desk lamp" became "lamp outside the frame" (desk wording removed, as the cutout rule asks).

Why this one: Annotations now read as faded ink, the flowers are grey, and the sheet sits inside the frame with margin to spare.

Round 1 (rejected, jobs `9bce5dca-2eeb-4a84-9088-149717ab33c2` and `dffe7e16-77f2-4b7a-8755-313d865ce6d4`): Both carried crisp, readable invented annotations (a place, a date, a height). B also kept a mauve tint in the flowers.

Round 1 prompt:

> A pressed foxglove stem on yellowed herbarium paper, ink annotations in the margin, lit by a single orange lamp, isolated object floating on pure black, no surface, no table, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

### 6. coroner-report

| | |
| --- | --- |
| Aspect ratio | 4:5 |
| Treatment | CUTOUT |
| File | `/public/images/coroner-report.webp` (2011 x 2400, alpha) |
| Kept | variation D (round 2), job `a135b8b3-f683-41c5-8310-c21eee0a29e8` |
| Background removal | job `9e3de040-a83a-40c0-93be-58a7a57831c3` |

Final prompt:

> A typed 1940s coroner's certificate, isolated object floating on pure black, no surface, no table, fountain pen beside it, a signature at the bottom, orange light from the top left, light source out of frame, the typed lines small, faded and illegible, no readable words, crisp clean paper edges against the black, the whole sheet and pen inside the frame with a wide black margin on every side, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Prompt edit: "on a dark desk" was replaced by the isolation phrase.

Why this one: Clean paper edge, no halo, a fold line and a signature, and typing that cannot be read.

Round 1 (rejected, jobs `3974940e-b0e4-4802-8919-4fea400fb316` and `5a517c9b-50fd-43d2-9ba7-85892544f215`): Both failed "nothing glows": the sheet came back with a soft halo and a ragged, blotched edge. Both also carried a fully readable invented inquest (a different victim, a different month).

Round 1 prompt:

> A typed 1940s coroner's certificate, isolated object floating on pure black, no surface, no table, fountain pen beside it, a signature at the bottom, orange light from the top left, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

### 7. journal

| | |
| --- | --- |
| Aspect ratio | 4:5 |
| Treatment | CUTOUT |
| File | `/public/images/journal.webp` (2400 x 1561, alpha) |
| Kept | variation C (round 2), job `2996747d-886a-4804-9bda-e06d1b101d88` |
| Background removal | job `2a100782-27b4-4a4c-9178-66d17b15e868` |

Final prompt:

> An open leather field notebook, dense handwriting, the last page filled with rows of capital letters in code, a pencil, orange lamplight from outside the frame, no lamp or lantern visible, isolated object floating on pure black, no surface, no table, the handwriting and letters too small and faded to read, no readable words, the whole notebook inside the frame with a wide black margin on every side, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Prompt edit: The prompt had no surface wording to replace, so the isolation phrase was appended.

Why this one: No lamp in frame. The coded page still reads as rows of capitals, but none of it can be transcribed.

Round 1 (rejected, jobs `5f619152-863d-424a-818c-63a6250d59dd` and `64ec8ba1-6166-4d00-8aeb-a3c67e7fa1d8`): Both put a lit, glowing lantern in the frame beside the notebook. Both also rendered the cipher as sharp capital letters a player could copy out.

Round 1 prompt:

> An open leather field notebook, dense handwriting, the last page filled with rows of capital letters in code, a pencil, orange lamplight, isolated object floating on pure black, no surface, no table, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

### 8. parish-register

| | |
| --- | --- |
| Aspect ratio | 4:5 |
| Treatment | CUTOUT |
| File | `/public/images/parish-register.webp` (2400 x 1696, alpha) |
| Kept | variation D (round 2), job `7a51dae9-7194-4112-b47e-0cf1c09c6b0d` |
| Background removal | job `88389e2a-77a1-4e1a-a270-b8780dae3f2e` |

Final prompt:

> A heavy parish death register open, isolated object floating on pure black, no surface, no table, ruled columns of handwritten entries, three pages torn out leaving ragged stubs, candlelight from outside the frame, no candle visible, the handwritten entries faded and illegible, no readable names or dates, the whole book inside the frame with a wide black margin on every side, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Prompt edit: "on a church lectern" was replaced by the isolation phrase.

Why this one: Exactly three torn stubs, as the prompt asks (C shows four). Entries read as ink, not as names.

Round 1 (rejected, jobs `4105619a-1071-490d-b6f0-bd43802d0071` and `4883400f-5e76-45ed-b50d-f28569ecbdd7`): Both listed dozens of readable invented names, ages, dates and real place names. A also ran off the right edge of the frame.

Round 1 prompt:

> A heavy parish death register open, isolated object floating on pure black, no surface, no table, ruled columns of handwritten entries, three pages torn out leaving ragged stubs, candlelight, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

### 9. marsh-lamps

| | |
| --- | --- |
| Aspect ratio | 21:9 |
| Treatment | SCENE |
| File | `/public/images/marsh-lamps.webp` (2400 x 1030) |
| Kept | variation B, job `5e799e38-a464-4466-bf9c-ed7861b41cab` |

Final prompt:

> A marsh at night with a line of iron lamp posts along a boardwalk, each lamp a small orange flame, one post in the middle with an empty hook, fog, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Why this one: The flames are orange rather than white-yellow, with no bloom, and the empty hook is unmistakable.

### 10. lamp-7

| | |
| --- | --- |
| Aspect ratio | 1:1 |
| Treatment | CUTOUT |
| File | `/public/images/lamp-7.webp` (994 x 2400, alpha) |
| Kept | variation A, job `c35ad2ec-8278-4dd7-aa8a-3afa0b1d0c84` |
| Background removal | job `b463e65b-e0da-468b-80ad-c3206a71eb09` |

Final prompt:

> An antique brass storm lantern hanging on a hook with a small tin tag stamped 7, its flame the only light, isolated object floating on pure black, no surface, no table, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Prompt edit: The prompt had no surface wording to replace, so the isolation phrase was appended. The hook was kept: it is part of the object.

Why this one: Smaller flame and a darker globe than B, whose glass fills with a warm haze. The hook rod leaves the top of the frame, so the pipeline dissolves the top 7% of the alpha instead of ending in a cut.

### 11. suspect-margot

| | |
| --- | --- |
| Aspect ratio | 3:4 |
| Treatment | PORTRAIT |
| File | `/public/images/suspect-margot.webp` (1797 x 2400) |
| Kept | variation bake-off render, job `a12f5f5c-b971-41be-8d6b-4b7b4a739129` |

Final prompt:

> Portrait of a woman in her fifties, 1940s dark dress and pearls, composed and cold, half her face in shadow, orange rim light from one side, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Why this one: The two renders from the portrait batch (484915e0-88c9-4a49-82d1-dd85b90c596c, dc3dc2a0-0cb9-4266-b64d-74ca9cab6fc0) pass every check but put the rim light on the left. The other four suspects are lit from the right. This render was made minutes earlier with the identical prompt, model and settings and is lit from the right, so it is the one that matches the wall.

### 12. suspect-crane

| | |
| --- | --- |
| Aspect ratio | 3:4 |
| Treatment | PORTRAIT |
| File | `/public/images/suspect-crane.webp` (1797 x 2400) |
| Kept | variation A, job `07ed2417-3cc1-4d26-84a1-f082e08aa028` |

Final prompt:

> Portrait of a man in his sixties, 1940s country doctor, wire spectacles, tweed suit, doctor's bag on his knee, calm half smile, half his face in shadow, orange rim light, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Why this one: The half smile and the spectacles read more clearly than in B, which is darker across the face.

### 13. suspect-tobias

| | |
| --- | --- |
| Aspect ratio | 3:4 |
| Treatment | PORTRAIT |
| File | `/public/images/suspect-tobias.webp` (1797 x 2400) |
| Kept | variation C (round 2), job `5cddb9f4-d310-483f-9957-7e1e534f510e` |

Final prompt:

> Portrait of a weathered groundskeeper in his forties, flat cap, oilskin coat, hands black with lamp soot, nervous eyes, orange rim light from the right side of the frame, no lantern or lamp in the picture, light source out of frame, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Why this one: No lantern. Framing closest to the other portraits. The light side was stated outright so it matches the rest.

Round 1 (rejected, jobs `901a2722-445f-499f-bd11-e90793e2d5db` and `4739c182-9442-42b0-931a-a3024d75416b`): In both he is holding a lit, glowing lantern the prompt never asked for. It fails "nothing glows" and it singles him out from the other four.

Round 1 prompt:

> Portrait of a weathered groundskeeper in his forties, flat cap, oilskin coat, hands black with lamp soot, nervous eyes, orange rim light, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

### 14. suspect-iris

| | |
| --- | --- |
| Aspect ratio | 3:4 |
| Treatment | PORTRAIT |
| File | `/public/images/suspect-iris.webp` (1797 x 2400) |
| Kept | variation A, job `2c36ccbf-c733-4f95-bf7d-072f64249e94` |

Final prompt:

> Portrait of a young woman in her twenties, 1940s cardigan, ink-stained fingers, guarded stare, half in shadow, orange rim light, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Why this one: B has her holding a lit lantern (glow). A has the pen, the notebook and the ink on her fingers.

### 15. suspect-pike

| | |
| --- | --- |
| Aspect ratio | 3:4 |
| Treatment | PORTRAIT |
| File | `/public/images/suspect-pike.webp` (1797 x 2400) |
| Kept | variation A, job `d5228d72-ef6b-4ce2-a3ee-b8ed01bead69` |

Final prompt:

> Portrait of an elderly vicar with a clerical collar holding a closed ledger, stern, half in shadow, orange rim light, cinematic still, northern England 1949, pure black background, subject isolated, every edge falling off into pure black, deep crushed shadows, a single warm orange lantern light source, everything else desaturated grey, 35 mm film grain, high contrast, documentary realism, no glow, no lens flare, no bloom, no text

Why this one: Rim light from the right, matching the other four. B is lit from the left.

## Regenerating an image

1. Generate with the model and settings above, using the final prompt.
2. For a cutout, run the result through `remove_background`.
3. Save the PNG as `.image-src/{name}.png` (the folder is git-ignored).
4. Run `npm run images -- --only {name}`.
5. Run `npm run seed:emulator` (or `seed:prod`) so room documents pick up the new dimensions.

The pipeline trims each cutout to its subject, dissolves any edge the subject
runs off, resizes to 2400 px on the long edge and rewrites
`scripts/content/images.generated.json` and `lib/public-images.generated.ts`.

---

# The venue: the main website's photographs

The eight photographs in `/public/venue` are of the place the main website
pretends to be: the reception of an escape room venue, and what is down its
corridor. There is no such building. Like the room's pictures, they were
generated with the Higgsfield MCP.

## Model and settings

| | |
| --- | --- |
| Model | **GPT Image 2.6** (Higgsfield id `gpt_image_2_6`), the model chosen above |
| Resolution | `4k` (3840 px on the long edge for 21:9 and 16:9; 3504 px for 3:2; 3200 px for 4:5) |
| Quality | `high` |
| Variations | 2 per photograph, 1 kept |
| Reference | The kept reception photograph, passed as `image_references` to the others. A retake is given the picture it replaces. |
| Final files | `scripts/process-venue.mjs`: WebP, quality 80, at two or three widths each |

The reception was made first, on its own. The other six were then made with
the kept reception as a reference image, and told they were the same venue on
the same evening. That is what makes the desk in the close-up the desk in the
wide shot, and the lamp, the bell and the box the same lamp, bell and box.

## Style suffix

Appended to every prompt. The reception's ends with the lens it was taken on
("Full-frame camera on a tripod, 24mm lens, f/8, natural perspective, straight
verticals") in place of the reference to itself.

> Editorial interior photography of a real place, the same venue and the same evening as the reference photograph: cream plaster walls above dark oak panelling, black-and-cream checkerboard tiled floor, aged brass fittings, deep oxblood red accents. Warm light from the lamps, soft natural shadows, true-to-life colour, fine detail, slight wear on every surface. No people. No watermark, no logo, no text other than what is described.

## Selection rules

A variation was kept only if all four held:

1. **Every word and number in it is right.** These pictures have lettering in
   them on purpose, and each was read at full size: `UNSEALED`, `RECEPTION`,
   `ROOMS` with its arrow, `NOTICES`, the cards `1` to `4`, the lockers `01` to
   `04`, the doors and hooks `001` to `005`, the tag stamped `OPEN`.
2. **Nothing else in it can be read.** The ledger's handwriting, the notice
   cards and the plate under the clock are too small or too faded to make
   out. What the plate and the ledger say is written on the page as text,
   where it can be changed without retaking a photograph.
3. **No people.**
4. **It is the same building as the reception.**

All fourteen renders passed, so each choice below was between two good
pictures. So did the eight made when door 002 opened, except one: a door
whose hinges were on the same side as its lock.

## What is in the pictures, and what follows from it

- **The site's name** is on the wall of the reception in brass letters, and so
  on the link preview picture. If `SITE.name` changes, retake `reception` and
  redraw the preview (`node scripts/make-og.mjs`).
- **The room numbers 001 to 005** are on the doors in `corridor` and on the
  plates in `keys`. If the catalogue grows past five or a number changes,
  retake those two.
- **Which doors are open** is in three pictures: the key rack on the wall of
  `reception`, the doors of `corridor` and the hooks of `keys`. An open room
  has a key with a tag where a sealed one has an envelope under wax, and a
  door standing ajar where a sealed one has a seal over its lock. When a door
  opens, those three are retaken and the new room's own door is photographed
  ([When a door opens](#when-a-door-opens), below). The pictures now show 001
  and 002 open.
- **The clock** in `reception` stands at ten past ten. It is a photograph and
  does not move. The lobby clock that does is the one on the board, on the
  page.

## The set

### reception (21:9)

Kept: `eb96460d-29d8-4812-976a-3dfa962a7ea6`. Not kept: `9fadb8e1-ca50-447e-a8ee-21c87f1d26e2`.

> Wide interior photograph, taken from just inside the front door, looking across the reception of a small escape room venue in an old townhouse. In the centre stands a long dark oak reception desk with a brass plaque on its front that reads RECEPTION. On the desk: a brass call bell, an open guest ledger with a fountain pen, a brass banker's lamp with a deep red glass shade, switched on, and a small brass-bound wooden lockbox with a paper tag tied to it. On the cream wall behind the desk, brass letters spell UNSEALED. To the left of the letters hangs a large round brass-rimmed wall clock showing ten past ten, with a small brass plate fixed under it, its engraving too small to read. To the right of the letters is a dark wooden key rack with a single row of five brass hooks: an old brass key with a paper tag hangs from the first hook, and each of the other four hooks holds a small cream envelope closed with a round red wax seal. At the far left are coat hooks with a dark hat and a coat, an umbrella stand and a fern in a pot. At the right a red velvet rope hangs between two brass posts across the opening of a corridor, and a small wooden sign hanging above it reads ROOMS with an arrow pointing right; beyond the rope the corridor runs back past closed doors and lit brass wall lamps. The floor is black-and-cream checkerboard tile.

Why this one: the edge of the open front door is in the left of the frame,
with its brass knob, so the picture is taken from where a visitor stands. The
other is the same room seen square on, from nowhere in particular.

**Retaken when door 002 opened.** Kept: `82f95414-8bc0-4a66-9d48-11c55c937dd2`.
Not kept: `5a761255-7494-4c4f-8123-8d2b0e75dcb8`. The reference was the
photograph above, and the prompt asks for the same picture with one change:

> Retake of the reference photograph, from the same spot with the same camera: the same wide interior photograph, taken from just inside the front door, looking across the reception of a small escape room venue in an old townhouse. Keep everything exactly as it is in the reference: the framing, the edge of the open front door with its brass knob at the left, the coat hooks with the dark hat and the coat, the umbrella stand and the fern in its pot, the long dark oak reception desk with the brass plaque on its front that reads RECEPTION, the brass call bell, the open guest ledger with the fountain pen, the brass banker's lamp with the deep red glass shade, switched on, the small brass-bound wooden lockbox with a paper tag tied to it, the leather chair behind the desk, the brass letters on the cream wall that spell UNSEALED, the large round brass-rimmed wall clock showing ten past ten with the small brass plate fixed under it, its engraving too small to read, the red velvet rope hanging between two brass posts across the opening of the corridor at the right, the small wooden sign hanging above it that reads ROOMS with an arrow pointing right, and the corridor running back past closed doors and lit brass wall lamps. One thing only has changed since the reference was taken. On the dark wooden key rack to the right of the brass letters, with its single row of five brass hooks, a key with a cream paper tag now hangs from each of the first two hooks: the old brass key on the first hook, as in the reference, and a darker old iron key on the second hook. Each of the other three hooks holds a small cream envelope closed with a round red wax seal. Two keys, then three envelopes, five hooks in all. Full-frame camera on a tripod, 24mm lens, f/8, natural perspective, straight verticals. Editorial interior photography of a real place: cream plaster walls above dark oak panelling, black-and-cream checkerboard tiled floor, aged brass fittings, deep oxblood red accents. Warm light from the lamps, soft natural shadows, true-to-life colour, fine detail, slight wear on every surface. No people. No watermark, no logo, no text other than what is described.

Why this one: the two keys are of a size. In the other the iron key is half
as long again as the brass one. Everything else in both is the reception as
it was: the letters, the plaque, the sign, the clock at ten past ten.

### desk (16:9)

Kept: `e90145d8-20fb-4b2b-90be-a6184dad05fc`. Not kept: `bcde6264-57e1-4e71-a196-60bd6216b61b`.

> Close photograph of the top of the same dark oak reception desk as in the reference image, seen from the visitor's side at a slight angle, 50mm lens, shallow depth of field. In sharp focus in the middle: the small brass-bound wooden lockbox, its hasp secured with a small brass four-digit combination padlock, a cream paper luggage tag tied to its handle with string, the writing on the tag turned away. Beside it lies the open guest ledger with ruled pages filled with faded handwriting too small to read, a black fountain pen across it, and the brass call bell. The brass banker's lamp with the deep red glass shade lights the desk from the right. Softly out of focus behind: the cream wall, the lower edge of the brass-rimmed wall clock and the small brass plate under it.

Why this one: the plate under the clock is in the frame, straight above the
box. The practice box on the page turns on that plate, and its caption points
at it.

### notices (4:5)

Kept: `c10f5fbf-2737-4061-87b3-9c417ede9566`. Not kept: `74d2ab0d-6bd9-4ff2-9671-ea860e34710e`.

> Photograph in the same venue as the reference image: a cork notice board in a dark oak frame hanging on the cream plaster wall above the dark oak panelling. A small brass plate fixed to the top of the frame is engraved with the single word NOTICES. Four cream index cards are pinned to the cork with red drawing pins, in two rows of two, each hanging slightly crooked. Each card carries one large handwritten numeral in red ink, 1, 2, 3 and 4 in order, and under the numeral a few lines of small faded handwriting too small to read. A lit brass wall lamp with a frosted glass shade beside the board casts warm light across it. 35mm lens, straight on.

Why this one: a doorway beside the board shows the corridor running back, so
the board is somewhere in the building and not on a bare wall.

### lockers (4:5)

Kept: `88abe41c-f3e7-47f3-be4e-85573834fe46`. Not kept: `3715a279-66e1-41e3-89aa-bbb8a50705b4`.

> Photograph in the same venue as the reference image: an alcove off the corridor with a row of four tall old steel lockers painted cream, standing on the black-and-cream checkerboard tiled floor against dark oak panelling. Each locker door has ventilation slits near the top, a small brass number plate and a brass padlock through its latch. The number plates read 01, 02, 03 and 04 from left to right. A worn oak bench stands in front of the lockers. A lit brass wall lamp with a frosted glass shade above them casts warm light. 35mm lens, straight on, the whole row of four lockers in frame.

Why this one: the red curtain tied back beside the lockers. It is the only
red in the picture, and the page it sits on is otherwise black.

### corridor (21:9)

Kept: `f84a28b5-1f6c-46e6-b86a-493bdc16e315`. Not kept: `008d122b-b364-4de8-ae82-a3a2dd35549f`.

> Straight-on photograph of one long wall of the corridor in the same venue as the reference image, framed like an architectural elevation. Five completely different doors stand side by side along the wall, each with a small brass number plate above it. The plates read 001, 002, 003, 004 and 005 from left to right. Door 001 is a plain panelled door painted cream, standing ajar, with strong warm orange lamplight spilling out through the gap and across the floor. Door 002 is an arched door of dark oak planks with black iron strap hinges. Door 003 is a round steel vault door with a spoked brass wheel. Door 004 is a tall pair of dark panelled double doors under a small classical pediment. Door 005 is a tiny arched door only knee high. Doors 002, 003, 004 and 005 are shut, and each has a large round red wax seal pressed over its lock. Lit brass wall lamps with frosted glass shades hang on the wall between the doors. Dark oak panelling below, cream plaster above, black-and-cream checkerboard tiled floor across the foreground. 28mm lens, straight verticals.

Why this one: door 001 stands wider open and its light reaches further across
the floor. On a phone the picture is cropped from the right, and that door
and its light are what is left.

**Retaken when door 002 opened.** Kept: `1407cdb2-7b89-441e-96a2-1ad2eb8c05f9`.
Not kept: `809cf53f-a5b8-41e4-9b10-f84a3f5fccdc`. The reference was the
photograph above.

> Retake of the reference photograph, from the same spot with the same camera: the same straight-on photograph of one long wall of the corridor of a small escape room venue, framed like an architectural elevation, 28mm lens, straight verticals. Keep everything exactly as it is in the reference: five completely different doors side by side along the wall, each with a small brass number plate above it; the plates read 001, 002, 003, 004 and 005 from left to right; the lit brass wall lamps with frosted glass shades on the wall between the doors; dark oak panelling below, cream plaster above, black-and-cream checkerboard tiled floor across the foreground. Door 001, the plain panelled door painted cream, stands ajar with strong warm orange lamplight spilling out through the gap and across the floor, exactly as in the reference. One thing only has changed since the reference was taken: room 002 has opened. Door 002, the arched door of dark oak planks with black iron strap hinges, now stands ajar as well, swung open toward the corridor on its hinges the way door 001 is, and flickering golden firelight spills out through the gap and across the checkerboard floor. Through the gap there is a glimpse of a rough stone wall lit by fire. The red wax seal that was pressed over the lock of door 002 is gone. Door 003, the round steel vault door with the spoked brass wheel, door 004, the tall pair of dark panelled double doors under the small classical pediment, and door 005, the tiny arched door only knee high, are still shut, and each still has its large round red wax seal pressed over its lock, exactly as in the reference. Two doors open, then three doors sealed, five doors in all. Editorial interior photography of a real place: cream plaster walls above dark oak panelling, black-and-cream checkerboard tiled floor, aged brass fittings, deep oxblood red accents. Warm light from the lamps, soft natural shadows, true-to-life colour, fine detail, slight wear on every surface. No people. No watermark, no logo, no text other than what is described.

Why this one: behind door 002 there is a fire basket on a stone floor against
a rough stone wall, which is a cellar. In the other there is a fireplace on
the corridor's own chequered tiles, and the door has grown a brass knob.

### keys (3:2)

Kept: `02e4aa31-81f3-4f7a-854b-d139299606d1`. Not kept: `10238845-1a63-438a-8c8f-e974d62788af`.

> Close photograph of the key rack from the reference image: a dark wooden board on the cream plaster wall with five brass hooks in a single row, and a small brass number plate fixed above each hook. The plates read 001, 002, 003, 004 and 005 from left to right. From hook 001 hangs the old brass key on a ring with a cream paper luggage tag on string; the tag is stamped with the single word OPEN in red ink. From each of the other four hooks hangs a small cream envelope closed with a round red wax seal. 50mm lens, straight on, warm side light from a lamp.

Why this one: both are right and there is nothing to choose between them. The
first was kept.

**Retaken when door 002 opened.** Kept: `cc077015-1a6c-4472-bcbb-95353ba4d13f`.
Not kept: `83694505-7af2-44c0-939e-42afa732b892`. The reference was the
photograph above.

> Retake of the reference photograph, from the same spot with the same camera: the same close photograph of the same key rack, 50mm lens, straight on, warm side light from a lamp. Keep everything exactly as it is in the reference: the dark wooden board on the cream plaster wall, the five brass hooks in a single row, and the small brass number plate fixed above each hook. The plates read 001, 002, 003, 004 and 005 from left to right. From hook 001 hangs the old brass key on a ring with a cream paper luggage tag on string, and the tag is stamped with the single word OPEN in red ink, exactly as in the reference. One thing only has changed since the reference was taken: room 002 has opened. The envelope that hung from hook 002 is gone, and in its place hangs a second key on a ring: a heavier, older key of dark iron with a round bow, with its own cream paper luggage tag on string, and that tag too is stamped with the single word OPEN in red ink. From each of hooks 003, 004 and 005 still hangs a small cream envelope closed with a round red wax seal, exactly as in the reference. Two keys, each with a tag stamped OPEN, then three sealed envelopes, five hooks in all. Editorial interior photography of a real place: cream plaster wall, aged brass fittings, deep oxblood red accents. Warm light from a lamp, soft natural shadows, true-to-life colour, fine detail, slight wear on every surface. No people. No watermark, no logo, no text other than what is described.

Why this one: again there is nothing to choose between them, and the first
was kept.

`key` and `key2`, the close pictures of the keys beside the headline, are not
photographs of their own. They are one piece of this one, cut in two between
the first hook and the second by `scripts/process-venue.mjs`, so that side by
side on the page they are still one picture and each half is a link to its
own room. The second runs on to the first sealed envelope. The stylesheet
sets them side by side in the proportions they were cut in, and a unit test
fails if the two disagree.

### door (4:5)

Kept: `3c7c9afa-c3ad-4375-ba26-39ca71a4d407`. Not kept: `3bf31180-b509-4e3d-b6d8-41946ff15d57`.

> Photograph in the corridor of the same venue as the reference image. A panelled door painted cream stands a hand's width ajar; strong warm orange lamplight spills through the gap across the black-and-cream checkerboard tiled floor and up the dark oak panelling. A small brass number plate above the door reads 001. An old brass key with a cream paper luggage tag hangs in the lock. A lit brass wall lamp with a frosted glass shade beside the door; the rest of the corridor falls away into warm shadow. 35mm lens, seen from a few steps back, slightly to one side.

Why this one: the door frame is dark oak, as it is on door 001 in the
photograph of the corridor. In the other the frame is painted cream.

### door2 (4:5)

Made when door 002 opened. Kept: `93f24210-f4a8-416c-bfa0-44c40d0d758e`. Not
kept: `4e98c779-fc0d-4bca-9652-53a487f98b30`. Two references: the photograph
of door 001 above, for how it is taken, and the first photograph of the
corridor, for what door 002 looks like.

> Photograph in the corridor of the same venue as the reference images, a companion to the first reference photograph, which is of door 001, and taken the same way. This one is of door 002: the arched door of dark oak planks with black iron strap hinges, in its arched dark oak frame, the door under the plate 002 in the second reference photograph, which shows the whole corridor. Door 002 stands a hand's width ajar. Flickering golden firelight spills through the gap across the black-and-cream checkerboard tiled floor and up the dark oak panelling, and through the gap there is a glimpse of a rough stone wall. A small brass number plate above the door reads 002. An old dark iron key with a cream paper luggage tag hangs in the lock. There is no wax seal on the door. A lit brass wall lamp with a frosted glass shade beside the door; the rest of the corridor falls away into warm shadow. 35mm lens, seen from a few steps back, slightly to one side. Editorial interior photography of a real place: cream plaster walls above dark oak panelling, black-and-cream checkerboard tiled floor, aged brass fittings, deep oxblood red accents. Warm light from the lamps, soft natural shadows, true-to-life colour, fine detail, slight wear on every surface. No people. No watermark, no logo, no text other than what is described.

Why this one: its hinges are on one side and its lock on the other. In the
other both are on the side the door opens at, which no door can do. What
hangs in the lock is an iron ring with the tag on it, and the description on
the page says so.

## Retaking a photograph

1. Generate with the model and settings above, the prompt and the style
   suffix, and the kept reception as the reference image. To retake the
   reception itself, generate it with no reference, then retake the others
   from the new one.
2. Read every word and number in the result at full size.
3. Save the PNG as `.image-src/venue/{name}.png` (the folder is git-ignored).
4. Run `npm run venue -- --only {name}`. For `keys`, also `--only key,key2`.
5. If it was the reception: `npm run build`, then `node scripts/make-og.mjs`.

## When a door opens

The building has to be the same building afterwards, with one more door open
in it. So a picture that shows which doors are open is not made again from
its first prompt. It is retaken from itself: the picture it replaces is the
reference image, and the prompt says "retake of the reference photograph,
from the same spot with the same camera", lists what must stay exactly as it
is, and then names the one thing that has changed. The three retakes above
are the pattern. Each came back as the same photograph with that one change.

1. **`reception`**: one more key with a tag on the rack, one envelope fewer.
2. **`corridor`**: the new room's door ajar, its seal gone, its own light
   coming through the gap. Say what kind of light and what can be glimpsed
   inside, from what the room's own front page shows.
3. **`keys`**: a key on a ring where its envelope was, with a tag stamped
   `OPEN`. Give it a different metal or pattern from the others.
4. **The room's own door**, like `door` and `door2`: two references, an
   existing door photograph for how it is taken and the corridor for what the
   door looks like. Check which side its hinges are on.
5. Read every plate, tag, letter and number in all of them at full size.
6. Cut the keys again in `scripts/process-venue.mjs`: one piece of `keys`
   from the first hook to the first sealed envelope, cut between the hooks,
   one part for each key. The cuts are in pixels of the source. Give the
   stylesheet's `.keyshots` the same proportions.
7. Process them (`npm run venue`), say which key and door belong to the room
   in `lib/site/venue.ts`, write the three descriptions on the home page
   again, and redraw the link preview (`npm run build`, then
   `node scripts/make-og.mjs`).

The pictures they replaced are not in the repository. Their job ids are
above, under each photograph.

# The cellar: File 002's pictures

The pictures in `/public/cellar` are of the place File 002, The Gold-Maker,
happens in: an alchemist's cellar in Prague in 1593, and the way out of it.
There is no such cellar. Like the others, they were generated with the
Higgsfield MCP.

**This section gives things away.** Half of these pictures are of what a
visitor sees only after they have worked something out, and a prompt has to
say what is in its picture. Nothing here says how any lock is set or what
any test shows, and one word that is an answer in itself has been left out of
one prompt. But if you mean to play the room, play it first.

## Model and settings

| | |
| --- | --- |
| Model | **GPT Image 2.6** (Higgsfield id `gpt_image_2_6`), as for everything else |
| Resolution | `4k` (3840 px on the long edge for 21:9; 3504 px for 3:2; 2880 px for 1:1) |
| Quality | `high` |
| Variations | 2 of each, 1 kept |
| Reference | The kept picture of the cellar, passed as `image_references` to every other picture taken inside it |
| Final files | `scripts/process-cellar.mjs` (`npm run cellar`): WebP, quality 80, at two to four widths each |

The whole cellar was made first, on its own, and is the picture a visitor
stands in. Every close picture was then made with it as a reference and told
it was the same cellar on the same night. That is what makes the bar in the
close picture the bar on the bench, and the furnace door with its four birds
the door in the wide view. The two pictures taken outside, and the four
woodcuts, had no reference.

**The crocodile** is not a picture of its own. It is cut from the cellar
(`from` and `crop` in the script).

## Selection rules

1. **Whatever the room says is there is there.** Four rods, the fourth
   stopped with black wax. A raven on the ash door. Seven jars tagged I to
   VII, with quicksilver in II and nothing in V. Four birds over four dials,
   in the order raven, swan, eagle, phoenix. Each was checked at full size.
2. **Nothing in a picture can be read** except the numerals on the jars. The
   order on the door, the notebook, the chart and the book are all written
   on the page as text. The notebook was asked for in mirror writing so that
   it could not be.
3. **No people.**
4. **It is the same cellar.**

All 48 renders passed, so each choice was between two good pictures.

## What is in the pictures, and what follows from it

- **Where things are.** Every thing a visitor can look at has a place in the
  picture it is in, written as percentages in
  `scripts/content/goldmaker.ts` (and, for things that are found later, in
  the sealed answers). If `cellar`, `door`, `jars`, `furnace-open`,
  `water` or `lane` is retaken, those places have to be measured again.
- **The jars.** The picture shows which jar is which number, that II runs and
  that V is empty. It does not show which metal is in which of the other
  five: they were asked for alike.
- **The birds.** Their order on the furnace door is in the picture, and so is
  the fact that there are four rings on the cupboard.

## The prompts

Each prompt below was followed by one of three endings.

For a picture taken inside the cellar:

> Photograph of a real place, the same cellar and the same night as the reference photograph: rough sandstone walls, old brick vault, worn flagstones, heavy dark oak, iron and brass. Lit by candlelight, warm, with soft natural shadows, true-to-life colour, fine detail, dust and wear on every surface. No people, no hands. No watermark, no logo, no text other than what is described.

For the two taken outside it:

> Photograph of a real place: full-frame camera on a tripod, 28mm lens, f/8, natural perspective. Cold dawn light, soft natural shadows, true-to-life colour, fine detail, wear on every surface. No people. No watermark, no logo, no text.

For the four woodcuts:

> Bold carved outlines and hatched shading, the slightly uneven inking of an old hand-pulled print, small flaws in the paper. Square composition, the roundel centred with a margin of blank paper around it. No letters, no numbers, no text, no watermark.

The cellar itself ended with the lens it was taken on, in place of the
reference to itself:

> Photograph of a real place, as for a museum's record: full-frame camera on a tripod, 24mm lens, f/8, long exposure, natural perspective, straight verticals. Warm candlelight, soft natural shadows, true-to-life colour, fine detail, dust and wear on every surface. No people. No watermark, no logo, no text.

### `cellar` (21:9)

> Wide interior photograph of a sixteenth-century alchemist's laboratory in a vaulted stone cellar in Prague, seen from just inside its door, looking down the length of the room. Rough sandstone block walls, a low barrel vault of old brick, a worn flagstone floor. Against the far wall stand two furnaces: on the left a small tower furnace of brick and clay, waist high, with a faint orange glow behind its little iron fire door; on the right a great brick furnace with a tall arched cast-iron door, cold, its brickwork pale and clean with no soot. Between the two furnaces a large leather bellows on a wooden frame and an iron scuttle heaped with charcoal. Along the right-hand wall runs a long heavy oak workbench: on it a brass balance in a glass-fronted wooden case, a single bar of gold lying on a folded dark red cloth, a lit candle in a brass candlestick, a stack of paper, glass flasks; a row of five iron rods and several iron tongs hang in a wooden rack on the wall above the bench. Along the left-hand wall: a tall oak lectern holding a large open book, a parchment chart pinned to the stone, a small oak wall cupboard with closed doors, a slope-fronted writing desk with a small walnut box on it, a round polished metal mirror hanging on the wall, shelves of glass alembics and retorts, and on the floor an open iron-bound strongbox, empty. A stuffed crocodile hangs from the vault on two chains. The room is lit only by the candle and the glow of the small furnace, with deep soft shadows.

Kept: job `4164193c-14ad-4783-ae37-cefc78ebd7fa`. Not kept: `635bfeee-2c93-4ded-aa34-69814f1594e8`. One door at the left edge, four rods on the rack, and a great furnace of pale clean brick that plainly has never been lit. The other has five rods and door leaves at both edges.

### `door` (3:2)

> Photograph inside the same cellar as the reference image, looking back at its only door from the middle of the room. The door is shut: a heavy arched door of dark oak planks with long black iron strap hinges and a big iron ring handle, set in a round sandstone arch. At eye height in the door there is a small square hatch closed by a sliding iron shutter. A single sheet of paper is nailed to the door below the hatch, covered in close handwriting too small to read, with a round red wax seal at its foot. To the left of the door a black wool cloak hangs from an iron peg in the wall. On the flagstones at the foot of the door lie the two halves of a thick oak beam that has been chopped through with an axe, with pale splinters around them. To the right of the door a tin lantern with a lit candle stands in a small niche in the wall. 35mm lens, straight on.

Kept: job `ca52a79a-4b2e-4181-8119-d1e094606882`. Not kept: `3b15192b-0d29-4e31-be7e-145a895d09a5`. The hatch, the order, the cloak, the cut beam and the lantern each stand clear of the others.

### `bar` (3:2)

> Close photograph of the gold bar from the reference image, on the same oak workbench: a single cast bar of gold, the length of a hand, lying on a folded dark red velvet cloth. Its surface is bright and smooth with softly rounded edges and no stamp or marking. Behind it, out of focus, the lit candle in its brass candlestick and the glass-fronted case of the balance. 50mm lens, shallow depth of field, seen from slightly above.

Kept: job `0ed62eae-52ef-48b4-9687-66678728d33c`. Not kept: `a3508982-7961-4dff-bc24-c97b018bacc8`. Its surface has the faint creases the cut bar has.

### `bar-cut` (3:2)

> Close photograph of the gold bar from the reference image, on the same oak workbench, lying on the folded dark red velvet cloth. One corner of the bar has been filed away in a deep notch: the cut shows that the gold is only a skin as thin as a leaf, and that the metal underneath is dull, soft, grey [one word, naming the metal, is left out of this copy]. A small steel file lies on the cloth beside the bar, and a few bright curls of gold foil and grey filings lie around the notch. Behind it, out of focus, the lit candle in its brass candlestick. 50mm macro lens, shallow depth of field, seen from slightly above, the notch in sharp focus.

Kept: job `bb9de5ca-f5fc-4d05-ab28-f4841fc3a197`. Not kept: `977f167b-4cab-4867-94f1-d77cf3c38dc9`. The gold reads as a torn skin, and the grey under it is plain.

### `rods` (3:2)

> Close photograph of the wooden rack on the wall above the workbench in the reference image: four long iron stirring rods hang from it in a row, each with a small iron ball at its top end. Three of the rods end at the bottom in plain blunt iron tips. The bottom tip of the fourth rod, the one at the right, is plugged with a stopper of shiny black wax, and there are grey finger-marks of ash on its shaft. Iron tongs hang further along the rack. Rough sandstone wall behind. 50mm lens, straight on, the four bottom tips of the rods in sharp focus.

Kept: job `16aa5834-0a0e-4955-b72a-9079bb969532`. Not kept: `62454b0c-ad61-41bf-af95-0935cab0d092`. The black stopper on the fourth rod is easier to see.

### `dust` (3:2)

> Close photograph on the oak workbench from the reference image: an iron stirring rod lies on its side on the bench. Its end is a hollow tube, and soft melted black wax has run out of it and pooled on the wood. A small bright heap of fine gold dust has poured out of the hollow rod onto the bench beside the wax. The lit candle in its brass candlestick stands close behind. 50mm macro lens, shallow depth of field, the gold dust in sharp focus.

Kept: job `d9ffdcc7-f8fe-4a39-b5e1-9b8cd7b35ad6`. Not kept: `1456b6eb-a2ea-4e51-b8cd-38ec2cb1cf18`. The rod runs out of the frame. In the other it has a ring for a handle, which the rods on the rack do not.

### `ash-door` (3:2)

> Close photograph of the foot of the small beehive furnace of brick and clay in the reference image. Low in its round brick base is a little square cast-iron ash door, hinged at one side, with a raven cast in relief on it. The ash door stands slightly ajar and shows a bed of pale grey ash inside. Its iron handle is worn bright and smeared with grey ash from a hand. At the top of the frame, the orange glow of the fire behind the furnace's iron grate. Flagstone floor. 50mm lens, low viewpoint.

Kept: job `3a70abce-db86-4313-b0fd-83d2163c684e`. Not kept: `355590c1-4bca-411f-b6a2-97325f923729`. The raven is clearer, and the handle is bright with ash on it.

### `key` (3:2)

> Close photograph on the flagstone floor in front of the small beehive furnace in the reference image, by its open cast-iron ash door: a rough dark grey lodestone the size of a plum, tied round with a loop of thin cord, lies on the stone, and a small old iron key, black with soot and dusted with ash, clings to the lodestone by one end. Spilled pale grey ash on the flagstones around them. Warm orange glow from the furnace. 50mm macro lens, shallow depth of field, the key in sharp focus.

Kept: job `8f93ad73-395d-4e4e-bba1-5f5a31807233`. Not kept: `64005c1e-1f86-41be-87c6-6569e6d17426`. The key is in sharper focus.

### `box` (3:2)

> Close photograph of the small walnut box that stands on the slope-fronted writing desk in the reference image: a plain dovetailed walnut box the size of a large book, with an iron lock plate and keyhole on its front. It is shut. On its lid are grey smudged finger-marks of ash. Beside it on the desk an inkwell with a quill pen. Rough sandstone wall behind. 50mm lens, shallow depth of field.

Kept: job `5f255f60-21c7-4f2e-8f6b-ce6628c8756a`. Not kept: `67a4ac3c-754d-42a8-9613-fa57b188393e`. The finger-marks on the lid show better.

### `box-open` (3:2)

> Close photograph of the small walnut box that stands on the slope-fronted writing desk in the reference image, now with its lid open. Inside, on a lining of faded green cloth, lie a small pocket notebook bound in dark leather and a fine steel file whose teeth are clogged with yellow gold dust. A small sooty iron key stands in the lock on the front of the box. Rough sandstone wall behind. 50mm lens, seen from above and in front, shallow depth of field.

Kept: job `ffb63e47-5daf-4a4a-892d-dcbd85d7ecaa`. Not kept: `0b50610b-0eb9-494a-a825-c5814b4c95c6`. Its notebook has the strap the notebook has in its own picture.

### `notebook` (3:2)

> Close photograph of a small pocket notebook bound in dark leather, lying open on the oak writing desk in the cellar from the reference image. Both pages are filled from edge to edge with dense, neat sixteenth-century handwriting in brown ink that runs backwards, in mirror writing, so that it cannot be read. No drawings and no diagrams, only lines of reversed handwriting. Candlelight from one side. 50mm macro lens, seen from directly above.

Kept: job `d1edbe2c-58e6-4206-8ed3-467df4424b9f`. Not kept: `7a30d3b2-22a2-44cd-b379-5fd7d559cb8c`. The pages fill more of the frame.

### `cupboard` (3:2)

> Photograph of the small oak wall cupboard from the reference image, seen straight on, hanging on the rough sandstone wall. Its two plank doors are shut and held by a flat brass bar that runs across both doors. Four thick brass rings are threaded on the bar in a row, and each ring is banded with coloured enamel. Above each ring a tiny bird is engraved in the brass bar. Iron strap hinges at the sides of the cupboard. 50mm lens, straight on.

Kept: job `76743e88-03a9-4847-be89-90a5629abfcb`. Not kept: `d6685e83-dc47-4532-851c-eafd8d5875c8`. The four birds over the rings are clearer.

### `jars` (3:2)

> Photograph of the small oak wall cupboard from the reference image, seen straight on, with both its doors standing wide open. Inside, on one shelf, seven squat clear glass jars stand in a single row. A small parchment tag hangs from the neck of each jar, and the tags are numbered in Roman numerals I, II, III, IV, V, VI and VII from left to right. Jar II holds a shallow pool of bright liquid quicksilver. Jar V is completely empty. Each of the other five jars, I, III, IV, VI and VII, holds one small dull dark grey metal bar the length of a finger, and the five bars look alike. 50mm lens, straight on, all seven jars and all seven tags in sharp focus.

Kept: job `918bca76-4c74-4c61-98c5-a9eaabf4bae1`. Not kept: `fe7d32ef-1d27-4cbc-b100-dd0ee69afbf2`. The jars and their tags are larger.

### `furnace` (3:2)

> Photograph of the great brick furnace from the reference image, seen straight on from a few steps away: pale clean cream brick with no soot anywhere, and a tall arched pair of studded cast-iron doors, shut. Where the two iron leaves meet, at chest height, there is an iron lock plate with four small round brass dials in a row. Above each dial a small bird is cast in iron: from left to right a raven, a swan, an eagle and a phoenix rising from flames. The hearth stone in front of the doors is swept clean. 35mm lens, straight on, the lock plate in sharp focus.

Kept: job `9ddcaf39-cbde-44ba-b25e-7aed1c7b4be9`. Not kept: `e35a92e3-d0dd-4156-af11-7fe0a750901e`. The four birds can each be told from the others.

### `furnace-open` (3:2)

> Photograph of the great brick furnace from the reference image, seen straight on from a few steps away, with its tall arched pair of studded cast-iron doors swung wide open. Inside there is no firebox, no grate, no ash and no soot: behind the doors a narrow passage of clean brick leads to a flight of worn stone steps going down out of sight. Faint cold bluish daylight comes up the steps from below, against the warm candlelight of the cellar. 35mm lens, straight on.

Kept: job `090dfdc0-f6eb-46f6-b3ac-f34b8d2e2017`. Not kept: `67d2888a-f8a4-41ba-93bb-53d5677feef2`. The steps can be seen going down.

### `water` (3:2)

> Photograph at first light at the foot of a flight of worn stone steps under an old house in Prague in the sixteenth century: a low round sandstone arch opens straight onto a narrow mill-race of dark slow water. An iron mooring ring is set in the wall beside the arch, with a short frayed end of wet rope still tied to it. In the wet mud at the water's edge is the long fresh groove left by the keel of a small boat. One gold coin lies on the lowest step. Mist on the water, and beyond the mill-race the wide river, pale in the dawn. There is no boat.

Kept: job `e9ef65cb-aa2e-4422-b39c-86b20464fd6b`. Not kept: `a51b3b23-5dc3-423a-b08f-eb0dfa4afb47`. The groove of the keel runs clearly down into the water.

### `lane` (3:2)

> Photograph at dawn in a steep narrow cobbled lane below the castle in Prague in the sixteenth century. In a sandstone wall, down three stone steps from the lane, is the outside of a cellar door: a heavy arched door of dark oak planks with long black iron strap hinges, shut, with a small square hatch at eye height. A soldier's halberd leans against the wall beside the door, and a tin lantern stands on the top step, still burning. Wet cobbles, pale sky, the first light on the roofs.

Kept: job `944469f3-b291-41ea-98ef-e9f6c0768211`. Not kept: `0070a4b9-cbe7-42ca-9f3b-39ddd94f2758`. The door is larger and its hatch is plain. In the room this is the street door of the house. The door a visitor is shut behind is inside, at the foot of a stair.

### `lodestones` (3:2)

> Close photograph on one of the wooden shelves of glass vessels in the reference image: among the glass flasks and retorts stands a shallow turned wooden bowl holding half a dozen rough dark grey lodestones, each the size of a plum and each tied round with a loop of thin cord. A few iron nails cling to one of the stones. Beside the bowl a small round tin box stands open and empty, with a few yellow crumbs of brimstone in it. Rough sandstone wall behind. 50mm lens, shallow depth of field.

Kept: job `2c3dd76f-334d-4259-9746-7ec9c47e1590`. Not kept: `90476892-b529-4003-b658-ac2fafd9eec9`. The empty tin is easier to read as empty.

### `strongbox` (3:2)

> Photograph of the iron-bound strongbox from the reference image, seen from above and in front, on the flagstone floor with its lid thrown back. It holds no coin at all: its shallow wooden trays show rows of round hollows where coins lay, every hollow empty. In the bottom of the box lies a scorched wooden mould for casting a metal bar, the length of a hand, with a spatter of dull grey metal on its lip, and beside it a thin ledger bound in parchment. 35mm lens.

Kept: job `21a94598-7d83-41cd-b3c8-d7c464d96ff0`. Not kept: `9dac7d49-982f-46bb-8f85-bc0329e673c9`. The grey spatter on the mould is clearer.

### `mirror` (3:2)

> Close photograph of the round convex mirror in its brass frame that hangs on the rough sandstone wall in the reference image. In its bulging glass the whole candle-lit cellar is reflected small and curved: the vault, the two furnaces, the bench with its candle. The glass is old and slightly spotted. No person is reflected in it. 50mm lens, straight on.

Kept: job `4b7bca56-4274-4555-ade4-c3e0c265bd4d`. Not kept: `7da7708f-fc21-497a-b09f-88c6326aeea5`. Brighter.

### `raven` (1:1)

> A sixteenth-century woodcut emblem, printed in black ink on cream laid paper. Inside a plain round border, a raven stands on a heap of ashes with its wings folded.

Kept: job `14d68240-ee19-4c45-aab3-62502d217804`. Not kept: `c432fc25-2d6f-41a8-bded-9a925ccf0166`. Either would do.

### `swan` (1:1)

> A sixteenth-century woodcut emblem, printed in black ink on cream laid paper. Inside a plain round border, a swan swims on rippling water under a crescent moon.

Kept: job `4ad49455-df5e-4ba0-9bee-2728bd380c1b`. Not kept: `e418757c-db97-4496-b614-402469190752`. Plainer sky.

### `eagle` (1:1)

> A sixteenth-century woodcut emblem, printed in black ink on cream laid paper. Inside a plain round border, an eagle with spread wings stands on a rock under a blazing sun.

Kept: job `fb3b9bc8-3185-4ec5-bc00-3f1cbc7bd06d`. Not kept: `5ade4936-d644-44a3-9b3c-b2905b36e94e`. Plainer sun.

### `phoenix` (1:1)

> A sixteenth-century woodcut emblem, printed in black ink on cream laid paper. Inside a plain round border, a phoenix with spread wings rises from a nest of flames.

Kept: job `0c79bf1a-53e6-491d-ac5d-3ea3f333f830`. Not kept: `4c2264ce-6722-41cd-9f94-33de30d24880`. The wings sit inside the border.

## Retaking one

Generate it again with the prompt above and, for a picture inside the cellar,
the kept `cellar` job as its reference. Save the PNG as
`.image-src/goldmaker/{name}.png` and run:

```bash
npm run cellar -- --only {name}
```

Then run the unit tests, which check that every picture the room names is on
disk at every width.
