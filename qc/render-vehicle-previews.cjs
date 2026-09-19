const { chromium } = require('playwright');
const fs = require('node:fs');

const PORT = Number(process.env.PORT) || 49218;
const BASE = `http://127.0.0.1:${PORT}`;
const IDS = (process.env.PREVIEW_IDS || 'yulu,delivery').split(',').map((id) => id.trim()).filter(Boolean);

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/qc/render-vehicle-previews.html`);
    await page.waitForFunction(() => !!window.renderVehiclePreview);
    fs.mkdirSync('assets/vehicles/previews', { recursive: true });
    for (const id of IDS) {
      const data = await page.evaluate((id) => renderVehiclePreview(id), id);
      const file = `assets/vehicles/previews/${id}.webp`;
      fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
      console.log(id, fs.statSync(file).size);
    }
    if (errors.length) throw Error(errors.join('\n'));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
