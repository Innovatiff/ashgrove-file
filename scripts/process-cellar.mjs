#!/usr/bin/env node
// Turns the chosen pictures of File 002, The Gold-Maker, into the WebP files
// that room ships, each at a few widths.
//
//   node scripts/process-cellar.mjs                 process everything
//   node scripts/process-cellar.mjs --only bar      process one or more (comma separated)
//
// Sources are read from .image-src/goldmaker/{name}.png (git-ignored: they
// are about 12 MB each). How they were made is in docs/image-prompts.md.
//
// Output
//   public/cellar/{name}-{width}.webp                 one file per width
//   public/cellar/og.jpg                              the link preview picture
//   scripts/content/cellar-images.generated.json      sizes, read by the seed
//   lib/goldmaker/pictures.generated.ts               the same, for the room's front page
//
// The room's own pages never import the JSON: what is in the cellar reaches
// a browser through Firestore, and only the front page's pictures are in the
// bundle.

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, '.image-src', 'goldmaker');
const outDir = path.join(root, 'public', 'cellar');
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1]?.split(',').map((name) => name.trim()) : undefined;

// Widths are what a picture is shown at, doubled. The cellar itself is a
// long picture a phone pans across at full height, so it goes wider than a
// phone is.
const SCENE = [960, 1440, 2000];
const CLOSE = [640, 960, 1440];
const CUT = [240, 480, 800];

// A picture may be a part of another one: `from` names the source it is cut
// from, and `crop` says which part, in pixels of that source.
export const PICTURES = [
  // Where a visitor stands.
  { name: 'cellar', widths: [1280, 1920, 2560, 3200] },
  { name: 'door', widths: SCENE },
  { name: 'jars', widths: SCENE },
  { name: 'furnace-open', widths: SCENE },
  { name: 'water', widths: SCENE },
  { name: 'lane', widths: SCENE },
  // What they look at.
  { name: 'bar', widths: CLOSE },
  { name: 'bar-cut', widths: CLOSE },
  { name: 'rods', widths: CLOSE },
  { name: 'dust', widths: CLOSE },
  { name: 'ash-door', widths: CLOSE },
  { name: 'key', widths: CLOSE },
  { name: 'box', widths: CLOSE },
  { name: 'box-open', widths: CLOSE },
  { name: 'notebook', widths: CLOSE },
  { name: 'cupboard', widths: CLOSE },
  { name: 'furnace', widths: CLOSE },
  { name: 'lodestones', widths: CLOSE },
  { name: 'strongbox', widths: CLOSE },
  { name: 'mirror', widths: CLOSE },
  // The crocodile, cut from the cellar.
  { name: 'crocodile', from: 'cellar', crop: { left: 1380, top: 0, width: 1260, height: 420 }, widths: [640, 1260] },
  // The four birds of the old master's book.
  { name: 'raven', widths: CUT },
  { name: 'swan', widths: CUT },
  { name: 'eagle', widths: CUT },
  { name: 'phoenix', widths: CUT },
];

/** The pictures the room's front page shows. Only these are in the bundle. */
const FRONT = ['cellar', 'raven', 'swan', 'eagle', 'phoenix'];

await mkdir(outDir, { recursive: true });
const manifest = {};
let failed = 0;

for (const picture of PICTURES) {
  const src = path.join(srcDir, `${picture.from ?? picture.name}.png`);
  const skip = only && !only.includes(picture.name);
  const sizes = [];

  for (const width of picture.widths) {
    const out = path.join(outDir, `${picture.name}-${width}.webp`);
    if (!skip) {
      if (!existsSync(src)) {
        console.error(`MISSING  ${picture.name}: no source at ${path.relative(root, src)}`);
        failed++;
        break;
      }
      const image = picture.crop ? sharp(src).extract(picture.crop) : sharp(src);
      await image
        .resize({ width, kernel: 'lanczos3', withoutEnlargement: true })
        .webp({ quality: 80, effort: 6, smartSubsample: true })
        .toFile(out);
    }
    if (!existsSync(out)) continue;
    const meta = await sharp(out).metadata();
    const kb = Math.round((await sharp(out).toBuffer()).length / 1024);
    sizes.push({ width: meta.width, height: meta.height, kb });
  }

  if (sizes.length === 0) continue;
  const largest = sizes[sizes.length - 1];
  manifest[picture.name] = { name: picture.name, width: largest.width, height: largest.height, widths: sizes.map((size) => size.width) };
  console.log(
    `${skip ? 'kept    ' : 'wrote   '} ${picture.name.padEnd(13)} ${String(largest.width).padStart(4)}x${String(largest.height).padEnd(4)}  ` +
      sizes.map((size) => `${size.width}w ${size.kb} KB`).join('   '),
  );
}

// The link preview: the middle of the cellar, 1200 by 630.
const cellar = path.join(srcDir, 'cellar.png');
if ((!only || only.includes('og')) && existsSync(cellar)) {
  const og = path.join(outDir, 'og.jpg');
  await sharp(cellar).resize({ width: 1470 }).extract({ left: 135, top: 0, width: 1200, height: 630 }).jpeg({ quality: 84, mozjpeg: true }).toFile(og);
  console.log(`wrote    og.jpg        1200x630   ${Math.round((await sharp(og).toBuffer()).length / 1024)} KB`);
}

await writeFile(path.join(root, 'scripts', 'content', 'cellar-images.generated.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const ts =
  `// Generated by scripts/process-cellar.mjs. Do not edit.\n` +
  `// The pictures the front page of The Gold-Maker shows: their size, and every width on disk.\n` +
  `// What is inside the cellar is not here. It reaches a browser through Firestore.\n\n` +
  `export const frontPictures = {\n` +
  FRONT.filter((name) => manifest[name])
    .map((name) => {
      const picture = manifest[name];
      return `  ${JSON.stringify(name)}: { name: ${JSON.stringify(name)}, width: ${picture.width}, height: ${picture.height}, widths: [${picture.widths.join(', ')}] },`;
    })
    .join('\n') +
  `\n} as const;\n\nexport type FrontPictureName = keyof typeof frontPictures;\n`;
await mkdir(path.join(root, 'lib', 'goldmaker'), { recursive: true });
await writeFile(path.join(root, 'lib', 'goldmaker', 'pictures.generated.ts'), ts);

if (failed > 0) {
  console.error(`\n${failed} picture(s) have no source.`);
  process.exit(1);
}
