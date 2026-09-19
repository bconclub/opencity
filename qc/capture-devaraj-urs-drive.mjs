import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const base = process.env.QC_BASE || 'http://127.0.0.1:49321';
const outDir = process.env.QC_OUT_DIR || join(import.meta.dirname, 'devaraj-urs');
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
await page.route('**/multiplayer-client.js', (route) => route.fulfill({ contentType: 'text/javascript', body: '' }));
await page.route('**/local-cache.js*', (route) => route.fulfill({ contentType: 'text/javascript', body: '' }));
await page.addInitScript(() => {
  localStorage.setItem('opencity-player-name', 'QC Agent');
});
await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.cityBootReady, { timeout: 120000 });
await page.waitForSelector('#vehicle-picker [data-ride]:not([disabled])', { timeout: 120000 });

await page.click('#vehicle-picker [data-ride="auto"]');
await page.click('#ride-now');
await page.getByRole('button', { name: /Vidhana Soudha area/ }).click();
await page.waitForFunction(() => window.autoState?.().active, { timeout: 60000 });
await page.waitForTimeout(800);
await page.screenshot({ path: join(outDir, 'after-departure.png'), fullPage: true });

// Drive along Devaraj Urs corridor (NE toward Gate 1 / KPSC).
for (let i = 0; i < 4; i++) {
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(1200);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowRight');
  await page.screenshot({ path: join(outDir, `after-drive-${i + 1}.png`), fullPage: true });
}

const summary = await page.evaluate(async () => {
  const d = await fetch('./vidhana-street-data.json').then((r) => r.json());
  const devaraj = d.features.filter((f) => f.properties?.name === 'Devaraj Urs Road');
  const count = (kind) => devaraj.filter((f) => f.properties?.kind === kind).length;
  const barrierKinds = ['barrier_police', 'barrier_cone', 'barrier_post', 'barrier_rail'];
  const devarajBarriers = Object.fromEntries(
    barrierKinds.map((k) => [k, devaraj.filter((f) => f.properties?.kind === k).length]),
  );
  const globalBarriers = Object.fromEntries(
    barrierKinds.map((k) => [k, d.features.filter((f) => f.properties?.kind === k).length]),
  );
  return {
    devarajTotal: devaraj.length,
    devarajLane: count('lane'),
    devarajRoad: count('road'),
    devarajKerb: count('kerb'),
    devarajFootpath: count('footpath'),
    devarajBarriers,
    globalBarriers,
    vidhanaState: window.vidhanaStreetState?.(),
    furnitureState: window.streetFurnitureState?.(),
  };
});
console.log(JSON.stringify({ outDir, base, ...summary }, null, 2));
await browser.close();
