const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const {selectCoverage} = require('./select-coverage.cjs');
const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const source = path.join(root, 'vidhana-streets.osm');
const output = path.join(__dirname, 'coverage-500');
const server = http.createServer((req, res) => {
  const files = {'/module.mjs': 'D:/CodexTools/OSM2World/osm2world-core-web.mjs', '/input.osm': source};
  if (files[req.url]) {
    res.setHeader('Content-Type', req.url.endsWith('.mjs') ? 'text/javascript' : 'text/xml');
    res.end(fs.readFileSync(files[req.url]));
  } else if (req.url === '/style.properties') {
    res.setHeader('Content-Type', 'text/plain'); res.end('lod = 2\n');
  } else if (req.url === '/favicon.ico') { res.statusCode = 204; res.end();
  } else if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><title>500 m street conversion</title>');
  } else { res.statusCode = 404; res.end(); }
});
(async () => {
  await new Promise(resolve => server.listen(4198, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({channel: 'msedge', headless: true});
    const page = await browser.newPage();
    const errors = [], logs = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.text()); });
    await page.goto('http://127.0.0.1:4198');
    const elements = await page.evaluate(async () => {
      const xml = new DOMParser().parseFromString(await (await fetch('/input.osm')).text(), 'text/xml');
      if (xml.querySelector('parsererror')) throw Error('Invalid OSM XML');
      const tags = el => Object.fromEntries([...el.querySelectorAll('tag')].map(t => [t.getAttribute('k'), t.getAttribute('v')]));
      return [...xml.querySelectorAll('osm > node, osm > way')].map(el => el.tagName === 'node'
        ? {type: 'node', id: Number(el.id), lon: Number(el.getAttribute('lon')), lat: Number(el.getAttribute('lat')), tags: tags(el)}
        : {type: 'way', id: Number(el.id), nodes: [...el.querySelectorAll('nd')].map(n => Number(n.getAttribute('ref'))), tags: tags(el)});
    });
    const selected = selectCoverage(elements, [77.5908, 12.9798], 500);
    if (selected.missingNodeWays.length) throw Error('Incomplete source highway references: ' + selected.missingNodeWays.join(','));
    const converted = await page.evaluate(async input => {
      const {O2WConverter, loadO2WConfig} = await import('/module.mjs');
      const config = await new Promise((resolve, reject) => loadO2WConfig(location.origin + '/style.properties', {lod: '2', mapProjection: 'MetricMapProjection'}, resolve, reject));
      const converter = new O2WConverter(); converter.setConfig(config);
      const start = performance.now();
      const meshes = await new Promise((resolve, reject) => converter.convertJson(JSON.stringify(input), resolve, reject));
      return {conversionMs: performance.now() - start, geometry: meshes.map(m => ({positions: Array.from(m.positions()), normals: Array.from(m.normals()), indices: Array.from(m.indices()), uvs: Array.from(m.uvs()), color: Array.from(m.color()), texture: m.baseColorTexture()}))};
    }, selected.input);
    if (errors.length) throw Error(errors.join('\n'));
    for (const mesh of converted.geometry) {
      if (![...mesh.positions, ...mesh.normals, ...mesh.indices].every(Number.isFinite)) throw Error('Non-finite converter geometry');
      if (mesh.indices.some(i => i < 0 || i >= mesh.positions.length / 3)) throw Error('Invalid converter triangle index');
    }
    fs.mkdirSync(output, {recursive: true});
    fs.writeFileSync(path.join(output, 'input.json'), JSON.stringify(selected.input));
    fs.writeFileSync(path.join(output, 'meshes.json'), JSON.stringify(converted.geometry));
    fs.writeFileSync(path.join(output, 'provenance.json'), JSON.stringify(selected.provenance, null, 2));
    const stats = {...selected.stats, sourceSha256: crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),
      conversionMs: converted.conversionMs, meshes: converted.geometry.length,
      triangles: converted.geometry.reduce((n, m) => n + m.indices.length / 3, 0),
      jsonBytes: fs.statSync(path.join(output, 'meshes.json')).size, warnings: logs,
      runtimeIntegrated: false, circularMeshClipping: 'Not performed; source endpoints and complete mapped areas are retained'};
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(stats, null, 2) + '\n');
    console.log(JSON.stringify(stats));
  } finally { await browser?.close(); server.close(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; server.close(); });
