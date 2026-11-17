/**
 * Draws the picture a link to the main website is shown with when someone
 * shares it: public/unsealed-og.png, 1200 by 630.
 *
 *   npm run build
 *   node scripts/make-og.mjs
 *
 * It is made from the built site itself, so it always matches it: the
 * stylesheet, the typefaces and the corridor drawing are read out of
 * out/index.html and set on a card of the right size. Run it again after
 * changing the name, the headline, the colours or the drawing, and commit the
 * picture.
 *
 * It needs Playwright with a Chromium to drive. Playwright is not one of
 * this project's dependencies: this is a tool for the person changing the
 * design, not a step of the build.
 */

import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'out');
const target = path.join(root, 'public', 'unsealed-og.png');

if (!existsSync(path.join(out, 'index.html'))) {
  console.error('No built site in /out. Run `npm run build` first.');
  process.exit(1);
}

// require() rather than import(), so a Playwright installed outside the
// project (on NODE_PATH) is found as well as one inside it.
let chromium;
try {
  ({ chromium } = createRequire(import.meta.url)('playwright'));
} catch {
  console.error('Playwright is not installed. Run `npm install --no-save playwright && npx playwright install chromium`, then try again.');
  process.exit(1);
}

const home = readFileSync(path.join(out, 'index.html'), 'utf8');
const pick = (pattern, what) => {
  const found = pattern.exec(home);
  if (!found) {
    console.error(`Could not find ${what} in out/index.html. Has the home page changed shape?`);
    process.exit(1);
  }
  return found;
};

const fonts = pick(/<html[^>]*class="([^"]*)"/, 'the font classes on <html>')[1];
const sheets = [...home.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((match) => match[1]);
const corridor = pick(/<figure class="corridor">[\s\S]*?<\/figure>/, 'the corridor drawing')[0]
  // On the card the whole corridor is shown, not cropped to fill.
  .replace('xMinYMax slice', 'xMinYMax meet');
const headline = pick(/<h1[^>]*id="hero-title"[^>]*>([\s\S]*?)<\/h1>/, 'the headline')[1];
const label = pick(/<p class="label">([^<]*)<\/p>/, 'the line above the headline')[1];
const wordmark = pick(/<a class="wordmark"[^>]*>([\s\S]*?)<\/a>/, 'the name')[1];

const TYPES = { '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
let card = '';
const server = createServer((request, response) => {
  if (request.url === '/__card') {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(card);
    return;
  }
  const file = path.join(out, decodeURIComponent((request.url ?? '/').split('?')[0]));
  if (!file.startsWith(out) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

card = `<!doctype html>
<html lang="en-GB" class="${fonts}">
  <head>
    <meta charset="utf-8" />
    ${sheets.map((href) => `<link rel="stylesheet" href="${href}" />`).join('\n    ')}
    <style>
      html, body { width: 1200px; height: 630px; min-height: 0; overflow: hidden; }
      body { display: block; }
      .card { position: relative; width: 1200px; height: 630px; padding: 54px 64px; }
      .card h1 { margin-top: 20px; max-width: none; font-size: 84px; line-height: 0.96; }
      .card .wordmark { position: absolute; top: 46px; right: 64px; font-size: 32px; }
      .card .corridor { position: absolute; left: 64px; bottom: 0; width: 1072px; height: 330px; margin: 0; }
    </style>
  </head>
  <body>
    <div class="card">
      <p class="label">${label}</p>
      <h1 class="display">${headline}</h1>
      <span class="wordmark">${wordmark}</span>
      ${corridor}
    </div>
  </body>
</html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/__card`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: target, type: 'png' });
  console.log(`Wrote ${path.relative(root, target)} (1200 by 630).`);
} finally {
  await browser.close();
  server.close();
}
