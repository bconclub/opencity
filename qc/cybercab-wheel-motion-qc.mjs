import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';

const roadNetwork = await readFile('qc/street-500-scene-data/vidhana-road-network.json');

const BASE = 'http://127.0.0.1:49321';
const MEDIA = '/cursor/stores/bc-adb66d99-2e64-4cb7-8679-bdb30c738129/media';
const results = { checks: {}, errors: [], screenshots: [] };

const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

try {
  await mkdir(MEDIA, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  page.setDefaultTimeout(120000);
  page.on('pageerror', (e) => results.errors.push(e.message));

  await page.route('**/local-cache.js*', (r) => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('**/multiplayer-client.js*', (r) => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('**/vidhana-road-network.json', (r) => r.fulfill({ contentType: 'application/json', body: roadNetwork }));

  await page.goto(BASE + '/');
  await page.waitForFunction(() => window.cityBootReady || document.getElementById('vehicle-entry-status')?.textContent === 'Choose your ride', null, { timeout: 120000 });
  await page.evaluate(() => {
    window.cityBootReady = true;
    document.body.classList.remove('city-booting');
    document.getElementById('city-loading')?.remove();
  });

  await page.locator('.ride-strip [data-ride="cybercab"]').click();
  await page.locator('#ride-now').click();
  await page.getByRole('button', { name: /Vidhana Soudha area/ }).click();
  await page.waitForFunction(() => window.autoState?.().active, null, { timeout: 90000 });

  const rigBefore = await page.evaluate(async () => {
    await new Promise((r) => setTimeout(r, 800));
    const s = window.autoState?.() || {};
    const assets = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('cybercab') && n.endsWith('.glb'));
    return { wheelAngle: s.wheelAngle, speed: s.speed, vehicleType: s.vehicleType, assets };
  });
  results.checks.rigBefore = rigBefore;
  assert.equal(rigBefore.vehicleType, 'cybercab');
  assert.ok(rigBefore.assets.some((n) => n.includes('cybercab-rigged.glb')), 'player cybercab should load cybercab-rigged.glb');
  assert.ok(!rigBefore.assets.some((n) => n.includes('cybercab-original.glb')), 'player cybercab should not load cybercab-original.glb');

  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(2500);
  const rigAfter = await page.evaluate(() => {
    const s = window.autoState?.() || {};
    return { wheelAngle: s.wheelAngle, speed: s.speed, distance: s.distance, steer: s.physics?.steer ?? 0 };
  });
  await page.keyboard.up('ArrowUp');
  results.checks.rigAfter = rigAfter;
  assert.ok(rigAfter.speed > 0.5, 'cybercab should move forward under throttle');
  assert.ok(rigAfter.wheelAngle > 0.2, 'wheel angle should advance while driving (updateDrive path active)');
  results.checks.wheelSpin = rigAfter.wheelAngle > rigBefore.wheelAngle;

  await page.screenshot({ path: `${MEDIA}/cybercab-wheel-motion-qc.png`, fullPage: false });
  results.screenshots.push(`${MEDIA}/cybercab-wheel-motion-qc.png`);

  results.pass = true;
  console.log(JSON.stringify(results, null, 2));
} catch (err) {
  results.pass = false;
  results.fatal = String(err?.stack || err);
  console.error(JSON.stringify(results, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
