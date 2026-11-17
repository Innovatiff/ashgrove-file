#!/usr/bin/env node
// Turns the chosen Higgsfield sources into the WebP files the site ships.
//
//   node scripts/process-images.mjs                 process everything
//   node scripts/process-images.mjs --only lamp-7   process one or more (comma separated)
//   node scripts/process-images.mjs --src ./somewhere
//
// Sources are read from .image-src/{name}.png (git-ignored: they are 5 to 30 MB
// each). Cutout sources must already have their background removed.
//
// Output
//   public/images/{name}.webp                 2400px on the long edge
//   scripts/content/images.generated.json     every image, read by the seed script
//   lib/public-images.generated.ts            only the images used on public pages

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { IMAGES, LONG_EDGE } from './images.config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const srcDir = path.resolve(root, flag('--src') ?? '.image-src');
const outDir = path.join(root, 'public', 'images');
const only = flag('--only')?.split(',').map((s) => s.trim());

/** Alpha below this is treated as empty: the remover leaves a faint haze. */
const ALPHA_FLOOR = 12;
/** Fraction of the frame over which a subject that runs off an edge is dissolved. */
const FEATHER = 0.07;
/** Transparent breathing room added around a trimmed cutout. */
const PAD = 0.015;

async function processCutout(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const alphaAt = (x, y) => data[(y * w + x) * c + 3];

  // 1. Drop the haze so the bounding box is honest.
  for (let i = 3; i < data.length; i += c) if (data[i] < ALPHA_FLOOR) data[i] = 0;

  // 2. Which frame edges does the subject run off? Those get dissolved, so a
  //    cutout never ends in a straight cut.
  const band = 3;
  const touches = { top: false, bottom: false, left: false, right: false };
  for (let x = 0; x < w; x++) {
    for (let k = 0; k < band; k++) {
      if (alphaAt(x, k) > 96) touches.top = true;
      if (alphaAt(x, h - 1 - k) > 96) touches.bottom = true;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let k = 0; k < band; k++) {
      if (alphaAt(k, y) > 96) touches.left = true;
      if (alphaAt(w - 1 - k, y) > 96) touches.right = true;
    }
  }
  const fy = Math.round(h * FEATHER);
  const fx = Math.round(w * FEATHER);
  const ramp = (d, f) => (d >= f ? 1 : (d / f) ** 1.6);
  if (Object.values(touches).some(Boolean)) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let m = 1;
        if (touches.top) m *= ramp(y, fy);
        if (touches.bottom) m *= ramp(h - 1 - y, fy);
        if (touches.left) m *= ramp(x, fx);
        if (touches.right) m *= ramp(w - 1 - x, fx);
        if (m < 1) {
          const i = (y * w + x) * c + 3;
          data[i] = Math.round(data[i] * m);
        }
      }
    }
  }

  // 3. Trim to the subject.
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alphaAt(x, y) > ALPHA_FLOOR) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error('cutout is fully transparent');
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const pad = Math.round(Math.max(bw, bh) * PAD);
  const clear = { r: 0, g: 0, b: 0, alpha: 0 };

  const trimmed = await sharp(data, { raw: { width: w, height: h, channels: c } })
    .extract({ left: x0, top: y0, width: bw, height: bh })
    .extend({
      // An edge the subject runs off keeps no padding: it has already dissolved.
      top: touches.top ? 0 : pad,
      bottom: touches.bottom ? 0 : pad,
      left: touches.left ? 0 : pad,
      right: touches.right ? 0 : pad,
      background: clear,
    })
    .png()
    .toBuffer();

  return {
    pipeline: sharp(trimmed)
      .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: 'inside', kernel: 'lanczos3' })
      .webp({ quality: 86, alphaQuality: 100, effort: 6, smartSubsample: true }),
    note: Object.entries(touches).filter(([, v]) => v).map(([k]) => k),
  };
}

function processOpaque(file) {
  return {
    pipeline: sharp(file)
      .flatten({ background: '#000000' })
      .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: 'inside', kernel: 'lanczos3' })
      .webp({ quality: 84, effort: 6, smartSubsample: true }),
    note: [],
  };
}

/**
 * The art direction says orange is the only colour. This measures it: of the
 * pixels that carry any real colour, how many sit outside the orange band.
 */
async function audit(file) {
  const { data, info } = await sharp(file)
    .resize({ width: 480, height: 480, fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let seen = 0, coloured = 0, off = 0, edge = 0, edgeN = 0;
  const { width: w, height: h } = info;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const border = x < w * 0.04 || x > w * 0.96 || y < h * 0.04 || y > h * 0.96;
      if (border) { edge += max * (a / 255); edgeN++; }
      if (a < 128) continue;
      seen++;
      const sat = max === 0 ? 0 : (max - min) / max;
      if (sat < 0.28 || max < 0.14) continue;
      coloured++;
      let hue;
      if (max === r) hue = ((g - b) / (max - min)) % 6;
      else if (max === g) hue = (b - r) / (max - min) + 2;
      else hue = (r - g) / (max - min) + 4;
      hue = (hue * 60 + 360) % 360;
      if (hue < 6 || hue > 50) off++;
    }
  }
  return {
    coloured: (100 * coloured) / seen,
    offHue: (100 * off) / seen,
    edge: (255 * edge) / edgeN,
  };
}

await mkdir(outDir, { recursive: true });
const manifest = {};
let failed = 0;

for (const image of IMAGES) {
  const out = path.join(outDir, `${image.name}.webp`);
  const src = path.join(srcDir, `${image.name}.png`);
  const skip = only && !only.includes(image.name);

  if (!skip) {
    if (!existsSync(src)) {
      console.error(`MISSING  ${image.name}: no source at ${path.relative(root, src)}`);
      failed++;
      continue;
    }
    const { pipeline, note } = image.treatment === 'cutout' ? await processCutout(src) : processOpaque(src);
    await pipeline.toFile(out);
    image.note = note;
  }
  if (!existsSync(out)) continue;

  const meta = await sharp(out).metadata();
  const stats = await audit(out);
  manifest[image.name] = {
    src: `/images/${image.name}.webp`,
    width: meta.width,
    height: meta.height,
    treatment: image.treatment,
  };
  const kb = Math.round((await sharp(out).toBuffer()).length / 1024);
  const warn = stats.offHue > 0.6 ? '  <-- colour outside the orange band' : '';
  console.log(
    `${skip ? 'kept    ' : 'wrote   '} ${image.name.padEnd(16)} ${image.treatment.padEnd(8)} ` +
      `${String(meta.width).padStart(4)}x${String(meta.height).padEnd(4)} ${String(kb).padStart(4)} KB  ` +
      `alpha:${meta.hasAlpha ? 'yes' : 'no '}  coloured ${stats.coloured.toFixed(1).padStart(4)}%  ` +
      `off-orange ${stats.offHue.toFixed(2)}%  edge ${stats.edge.toFixed(1)}` +
      `${image.note?.length ? `  feathered:${image.note.join('+')}` : ''}${warn}`,
  );
}

await mkdir(path.join(root, 'scripts', 'content'), { recursive: true });
await writeFile(
  path.join(root, 'scripts', 'content', 'images.generated.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

const publicNames = IMAGES.filter((i) => i.public && manifest[i.name]).map((i) => i.name);
const ts =
  `// Generated by scripts/process-images.mjs. Do not edit.\n` +
  `// Only the images used on pages that need no clearance are listed here.\n\n` +
  `export const publicImages = {\n` +
  publicNames
    .map((n) => `  '${n}': { src: '${manifest[n].src}', width: ${manifest[n].width}, height: ${manifest[n].height} },`)
    .join('\n') +
  `\n} as const;\n\nexport type PublicImageName = keyof typeof publicImages;\n`;
await writeFile(path.join(root, 'lib', 'public-images.generated.ts'), ts).catch(async () => {
  await mkdir(path.join(root, 'lib'), { recursive: true });
  await writeFile(path.join(root, 'lib', 'public-images.generated.ts'), ts);
});

if (failed) {
  console.error(`\n${failed} image(s) could not be processed.`);
  process.exit(1);
}
