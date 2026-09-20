// Illustrative gate massing and boulevard trees for Devaraj Urs Road (OBS-01, OBS-04, OBS-06).
import {loadVidhanaStreetData} from './street-data.js';

const GATES = [
  {id: 'gate1', name: 'Vidhana Soudha Gate 1', lng: 77.5887702, lat: 12.9813056, heading: 83, ref: 'OBS-04'},
  {id: 'gate2', name: 'Vidhana Soudha Gate 2', lng: 77.5884787, lat: 12.9806515, heading: 127, ref: 'OBS-01'},
];

function buildGateGeometry(T, kind) {
  const positions = [], normals = [], colors = [];
  function add(g, color) {
    const flat = g.index ? g.toNonIndexed() : g;
    const c = new T.Color(color);
    positions.push(...flat.attributes.position.array);
    normals.push(...flat.attributes.normal.array);
    for (let i = 0; i < flat.attributes.position.count; i++) colors.push(c.r, c.g, c.b);
    if (flat !== g) flat.dispose();
    g.dispose();
  }
  function box(w, d, h, x, y, z, c) {
    const g = new T.BoxGeometry(w, d, h);
    g.translate(x, y, z + h / 2);
    add(g, c);
  }
  const stone = 0x9a9588, iron = 0x2a2a2a, cap = 0xb8b2a4, shed = 0xe8e6df, frame = 0x3d6b45;
  const pillar = kind === 'gate1' ? 1.45 : 1.35;
  const height = kind === 'gate1' ? 9.2 : 8.4;
  const span = kind === 'gate1' ? 7.8 : 6.8;
  box(pillar, pillar, height, -span / 2, 0, 0, stone);
  box(pillar, pillar, height, span / 2, 0, 0, stone);
  box(pillar * 1.08, pillar * 1.08, 0.55, -span / 2, 0, height, cap);
  box(pillar * 1.08, pillar * 1.08, 0.55, span / 2, 0, height, cap);
  for (let i = -3; i <= 3; i++) {
    const t = i / 3;
    box(0.12, 0.08, height * 0.82, t * (span / 2 - 0.4), 0.18, height * 0.08, iron);
    box(span * 0.92, 0.08, 0.12, 0, 0.18, height * (0.25 + Math.abs(t) * 0.18), iron);
  }
  box(span + pillar, 0.22, 0.35, 0, 0.12, height + 0.2, iron);
  if (kind === 'gate1') {
    box(10.5, 3.2, 2.6, -span / 2 - 5.8, -1.4, 0, shed);
    for (const x of [-9.8, -6.2, -2.6]) box(0.14, 0.14, 2.8, x, -1.4, 0, frame);
    box(10.5, 0.12, 2.8, -span / 2 - 5.8, -1.4, 2.55, frame);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  return g;
}

function sampleBoulevardTrees(roads, spacing = 11) {
  const cos = Math.cos(12.98 * Math.PI / 180);
  const cents = roads.map((f) => {
    const ring = f.geometry.coordinates[0];
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
    const cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    return {cx, cy, width: f.properties.width || 6.4};
  });
  const ref = [GATES[1].lng, GATES[1].lat];
  const axis = [GATES[0].lng - GATES[1].lng, GATES[0].lat - GATES[1].lat];
  const al = Math.hypot(...axis);
  const ux = axis[0] / al, uy = axis[1] / al;
  const nx = -uy, ny = ux;
  cents.sort((a, b) => (a.cx - ref[0]) * ux + (a.cy - ref[1]) * uy - ((b.cx - ref[0]) * ux + (b.cy - ref[1]) * uy));
  const samples = [];
  let last = -Infinity;
  for (const c of cents) {
    const along = (c.cx - ref[0]) * ux + (c.cy - ref[1]) * uy;
    if (along - last < spacing * 0.55) continue;
    last = along;
    const offset = c.width / 2 + 2.8;
    for (const side of [-1, 1]) {
      const lng = c.cx + nx * offset * side / (111320 * cos);
      const lat = c.cy + ny * offset * side / 111320;
      const h = 10.5 + (along % 17) * 0.22;
      const r = 4.2 + (along % 13) * 0.18;
      samples.push({lng, lat, h, r, side, along});
    }
  }
  return samples;
}

export async function installDevarajUrsLandmarks(map) {
  const [T, data] = await Promise.all([
    import('https://unpkg.com/three@0.169.0/build/three.module.js'),
    loadVidhanaStreetData(),
  ]);
  if (map.getLayer('devaraj-urs-landmarks')) return;
  const scene = new T.Scene(), camera = new T.Camera();
  scene.add(new T.HemisphereLight(0xfffaf0, 0x657169, 2.1));
  const sun = new T.DirectionalLight(0xffffff, 1.1);
  sun.position.set(-120, -90, 200);
  scene.add(sun);
  const origin = maplibregl.MercatorCoordinate.fromLngLat(data.center);
  const s = origin.meterInMercatorCoordinateUnits();
  const transform = new T.Matrix4().makeTranslation(origin.x, origin.y, 0).scale(new T.Vector3(s, -s, s));
  const material = new T.MeshLambertMaterial({vertexColors: true});
  const gateItems = GATES.map((gate) => {
    const p = maplibregl.MercatorCoordinate.fromLngLat([gate.lng, gate.lat]);
    return {...gate, x: (p.x - origin.x) / s, y: (origin.y - p.y) / s};
  });
  const gateGroups = ['gate1', 'gate2'].map((kind) => {
    const geometry = buildGateGeometry(T, kind);
    const items = gateItems.filter((g) => g.id === kind);
    const mesh = new T.InstancedMesh(geometry, material, items.length);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return {items, mesh, geometry};
  });
  const roads = data.features.filter((f) => f.properties?.name === 'Devaraj Urs Road' && f.properties?.kind === 'road');
  const treeSamples = sampleBoulevardTrees(roads);
  const trunk = new T.InstancedMesh(
    new T.CylinderGeometry(0.34, 0.58, 1, 6),
    new T.MeshStandardMaterial({color: 0x665341, roughness: 1}),
    treeSamples.length,
  );
  const crowns = new T.InstancedMesh(
    new T.IcosahedronGeometry(1, 0),
    new T.MeshStandardMaterial({color: 0xffffff, roughness: 1, flatShading: true}),
    treeSamples.length * 2,
  );
  const dummy = new T.Object3D(), color = new T.Color();
  treeSamples.forEach((t, i) => {
    const p = maplibregl.MercatorCoordinate.fromLngLat([t.lng, t.lat]);
    const x = (p.x - origin.x) / s, y = (origin.y - p.y) / s;
    dummy.position.set(x, y, t.h / 2);
    dummy.rotation.set(Math.PI / 2, 0, 0);
    dummy.scale.set(1, t.h, 1);
    dummy.updateMatrix();
    trunk.setMatrixAt(i, dummy.matrix);
    for (let j = 0; j < 2; j++) {
      const n = i * 2 + j;
      dummy.position.set(x + (j ? 0.8 : -0.6) * t.side, y + (j ? -0.5 : 0.4), t.h + (j ? 0.8 : -0.3));
      dummy.rotation.set(0.1, t.along * 0.03, t.side * 0.4);
      dummy.scale.set(t.r * 1.05, t.r * 0.95, t.r * 0.9);
      dummy.updateMatrix();
      crowns.setMatrixAt(n, dummy.matrix);
      color.setHSL(0.27 + (t.along % 5) * 0.01, 0.28 + (i % 3) * 0.04, 0.24 + (j ? 0.05 : 0));
      crowns.setColorAt(n, color);
    }
  });
  for (const mesh of [trunk, crowns]) {
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    scene.add(mesh);
  }
  let renderer, visible = 0, drawCalls = 0, submitMs = 0;
  map.addLayer({
    id: 'devaraj-urs-landmarks',
    type: 'custom',
    renderingMode: '3d',
    onAdd(m, gl) {
      renderer = new T.WebGLRenderer({canvas: m.getCanvas(), context: gl});
      renderer.autoClear = false;
    },
    render(gl, args) {
      const center = maplibregl.MercatorCoordinate.fromLngLat(map.getCenter());
      const cx = (center.x - origin.x) / s, cy = (origin.y - center.y) / s;
      visible = 0;
      drawCalls = 0;
      const dummy = new T.Object3D();
      for (const group of gateGroups) {
        let count = 0;
        for (const item of group.items) {
          if (Math.hypot(item.x - cx, item.y - cy) > 1400) continue;
          dummy.position.set(item.x, item.y, 0.12);
          dummy.rotation.set(0, 0, -item.heading * Math.PI / 180);
          dummy.updateMatrix();
          group.mesh.setMatrixAt(count++, dummy.matrix);
        }
        group.mesh.count = count;
        group.mesh.instanceMatrix.needsUpdate = true;
        visible += count;
        if (count) drawCalls++;
      }
      let trees = 0;
      for (let i = 0; i < treeSamples.length; i++) {
        const t = treeSamples[i];
        const p = maplibregl.MercatorCoordinate.fromLngLat([t.lng, t.lat]);
        const x = (p.x - origin.x) / s, y = (origin.y - p.y) / s;
        if (Math.hypot(x - cx, y - cy) > 1200) continue;
        dummy.position.set(x, y, t.h / 2);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        dummy.scale.set(1, t.h, 1);
        dummy.updateMatrix();
        trunk.setMatrixAt(trees, dummy.matrix);
        for (let j = 0; j < 2; j++) {
          const n = trees * 2 + j;
          dummy.position.set(x + (j ? 0.8 : -0.6) * t.side, y + (j ? -0.5 : 0.4), t.h + (j ? 0.8 : -0.3));
          dummy.rotation.set(0.1, t.along * 0.03, t.side * 0.4);
          dummy.scale.set(t.r * 1.05, t.r * 0.95, t.r * 0.9);
          dummy.updateMatrix();
          crowns.setMatrixAt(n, dummy.matrix);
        }
        trees++;
      }
      trunk.count = trees;
      crowns.count = trees * 2;
      trunk.instanceMatrix.needsUpdate = true;
      crowns.instanceMatrix.needsUpdate = true;
      visible += trees;
      if (trees) drawCalls += 2;
      camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix).multiply(transform);
      renderer.resetState();
      const start = performance.now();
      renderer.render(scene, camera);
      submitMs = performance.now() - start;
      window.recordCityRender?.('Devaraj Urs landmarks', renderer, submitMs);
      renderer.resetState();
    },
    onRemove() {
      for (const group of gateGroups) group.geometry.dispose();
      trunk.geometry.dispose();
      crowns.geometry.dispose();
      material.dispose();
      trunk.material.dispose();
      crowns.material.dispose();
      renderer.dispose();
    },
  });
  window.devarajUrsLandmarkState = () => ({
    loaded: true,
    gates: gateItems.length,
    boulevardTrees: treeSamples.length,
    visible,
    drawCalls,
    submitMs,
    source: 'OBS-01 Gate 2 · OBS-04 Gate 1 · OBS-06 boulevard canopy',
    shapeAccuracy: 'Illustrative monument massing; not surveyed gate geometry',
  });
  return {gates: gateItems.length, trees: treeSamples.length};
}
