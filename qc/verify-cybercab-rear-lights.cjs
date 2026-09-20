const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GLB = path.join(ROOT, 'assets/vehicles/cybercab-rigged.glb');
const PORT = 4177;

function serveStatic(req, res) {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const rel = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end('not found');
  }
  const ext = path.extname(file);
  const type = ext === '.js' ? 'text/javascript' : ext === '.json' ? 'application/json' : 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  fs.createReadStream(file).pipe(res);
}

(async () => {
  const server = createServer(serveStatic);
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/`);
    const result = await page.evaluate(async () => {
      const T = await import('/three/build/three.module.js').catch(() => import('three'));
      const { createBlenderVehicle } = await import('/blender-vehicle.js?v=qc');
      const model = createBlenderVehicle(T, 'cybercab');
      await model.ready;
      model.group.updateMatrixWorld(true);
      const lamps = [];
      model.group.traverse(o => {
        if (o.isMesh && o.material?.name === 'Lamps') lamps.push(o.name);
      });
      return {
        lampMeshes: model.group.userData.lampMeshes,
        lampNames: lamps.sort(),
        assetSource: model.group.userData.assetSource,
        wheels: model.wheels.length,
      };
    });
    assert.equal(result.lampMeshes, 2, 'expected 2 lamp meshes');
    assert.deepEqual(result.lampNames, ['Front_light_bar', 'Tail_light_bar']);
    assert.equal(result.wheels, 4);
    console.log(JSON.stringify({ status: 'PASS', ...result }));
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
