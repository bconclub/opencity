const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

function clipMesh(mesh, center, radius, segments = 256) {
  if (mesh.texture) throw Error('Textured source requires separate UV/material review');
  const out = {...mesh, positions: [], normals: [], indices: [], uvs: []};
  const edge = Array.from({length: segments}, (_, i) => [center[0] + radius * Math.cos(i * Math.PI * 2 / segments), center[1] + radius * Math.sin(i * Math.PI * 2 / segments)]);
  const innerRadius = radius * Math.cos(Math.PI / segments);
  const append = v => {
    out.positions.push(...v.p);
    const length = Math.hypot(...v.n) || 1;
    out.normals.push(...v.n.map(x => x / length));
    if (v.uv) out.uvs.push(...v.uv);
    out.indices.push(out.indices.length);
  };
  for (let i = 0; i < mesh.indices.length; i += 3) {
    let poly = mesh.indices.slice(i, i + 3).map(j => ({p: mesh.positions.slice(j * 3, j * 3 + 3), n: mesh.normals.slice(j * 3, j * 3 + 3), uv: mesh.uvs.length ? mesh.uvs.slice(j * 2, j * 2 + 2) : null}));
    if (!poly.every(v => Math.hypot(v.p[0] - center[0], v.p[2] - center[1]) <= innerRadius)) {
      for (let k = 0; k < segments && poly.length; k++) {
        const a = edge[k], b = edge[(k + 1) % segments];
        const signed = v => (b[0] - a[0]) * (v.p[2] - a[1]) - (b[1] - a[1]) * (v.p[0] - a[0]);
        const next = [];
        for (let j = 0; j < poly.length; j++) {
          const p = poly[j], q = poly[(j + 1) % poly.length], dp = signed(p), dq = signed(q);
          if (dp >= 0) next.push(p);
          if ((dp >= 0) !== (dq >= 0)) {
            const t = dp / (dp - dq), mix = (a, b) => a.map((x, n) => x + t * (b[n] - x));
            next.push({p: mix(p.p, q.p), n: mix(p.n, q.n), uv: p.uv ? mix(p.uv, q.uv) : null});
          }
        }
        poly = next;
      }
    }
    for (let j = 1; j + 1 < poly.length; j++) {
      const [a, b, c] = [poly[0], poly[j], poly[j + 1]];
      const u = b.p.map((x, k) => x - a.p[k]), v = c.p.map((x, k) => x - a.p[k]);
      if (Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]) < 1e-9) continue;
      append(a); append(b); append(c);
    }
  }
  return out;
}

function verify() {
  const triangle = (positions, normal) => ({positions, normals: [...normal, ...normal, ...normal], indices: [0, 1, 2], uvs: [], color: [.5, .5, .5], texture: null});
  const flat = clipMesh(triangle([-20, 0, -2, 20, 0, -2, 0, 0, 20], [0, 1, 0]), [0, 0], 10);
  assert(flat.indices.length > 3);
  for (let i = 0; i < flat.positions.length; i += 3) assert(Math.hypot(flat.positions[i], flat.positions[i + 2]) <= 10 + 1e-8);
  const vertical = clipMesh(triangle([-20, 0, 0, 20, 0, 0, 0, 4, 0], [0, 0, 1]), [0, 0], 10);
  assert(vertical.indices.length >= 6); assert.equal(Math.max(...vertical.positions.filter((_, i) => i % 3 === 1)), 4);
  assert.equal(clipMesh(triangle([30, 0, 30, 40, 0, 30, 30, 0, 40], [0, 1, 0]), [0, 0], 10).indices.length, 0);
  const inside = triangle([0, 0, 0, 1, 0, 0, 0, 0, 1], [0, 1, 0]);
  assert.deepEqual(clipMesh(inside, [0, 0], 10).positions, inside.positions);
}

if (require.main === module) {
  verify();
  const dir = path.join(__dirname, 'coverage-500'), stats = JSON.parse(fs.readFileSync(path.join(dir, 'results.json')));
  const source = JSON.parse(fs.readFileSync(path.join(dir, 'meshes.json'))), origin = stats.projectionOrigin;
  const circ = 2 * Math.PI * 6371008.8 * Math.cos(origin[1] * Math.PI / 180);
  const mercY = lat => (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2;
  const center = [(stats.selectionCenter[0] - origin[0]) * circ / 360, (mercY(origin[1]) - mercY(stats.selectionCenter[1])) * circ];
  const meshes = source.map(m => clipMesh(m, center, 500)).filter(m => m.indices.length);
  let maxRadius = 0;
  for (const mesh of meshes) for (let i = 0; i < mesh.positions.length; i += 3) maxRadius = Math.max(maxRadius, Math.hypot(mesh.positions[i] - center[0], mesh.positions[i + 2] - center[1]));
  assert(maxRadius <= 500.00001);
  fs.writeFileSync(path.join(dir, 'meshes-clipped.json'), JSON.stringify(meshes));
  const report = {center, radiusM: 500, clipSides: 256, maximumBoundaryInsetM: 500 * (1 - Math.cos(Math.PI / 256)), maximumVertexRadiusM: maxRadius,
    sourceTriangles: source.reduce((n, m) => n + m.indices.length / 3, 0), clippedTriangles: meshes.reduce((n, m) => n + m.indices.length / 3, 0), testsPassed: true, runtimeIntegrated: false};
  fs.writeFileSync(path.join(dir, 'clip-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
}
module.exports = {clipMesh};
