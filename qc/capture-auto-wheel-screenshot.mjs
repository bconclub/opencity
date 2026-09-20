import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function capture() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600 });
  
  const htmlPath = path.join(__dirname, 'auto-wheel-preview.html');
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(2000);
  
  const outputPath = path.join(__dirname, 'auto-wheel-screenshot.png');
  await page.screenshot({ path: outputPath, fullPage: true });
  
  console.log(`Screenshot saved to ${outputPath}`);
  await browser.close();
}

capture().catch(console.error);
