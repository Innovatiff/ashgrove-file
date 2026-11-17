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
