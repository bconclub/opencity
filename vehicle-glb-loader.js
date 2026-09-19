import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const B64_PARTS = new Map();

async function fetchAscii(path) {
  const res = await fetch(path);
  if (!res.ok) return null;
  const text = await res.text();
  if (!text || text.length < 100 || text.startsWith('LOAD_FROM') || text.startsWith('REQUIRE_FROM')) return null;
  return text;
}

async function loadGlbB64Parts(basePath, maxParts = 512) {
  const cached = B64_PARTS.get(basePath);
  if (cached) return cached;
  const parts = [];
  for (let i = 1; i <= maxParts; i += 1) {
    const chunk = await fetchAscii(`${basePath}.b64.part${i}`);
    if (!chunk) break;
    parts.push(chunk);
  }
  const b64 = parts.length ? parts.join('') : null;
  if (b64) B64_PARTS.set(basePath, b64);
  return b64;
}

function b64ToArrayBuffer(b64) {
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

export async function loadGlbScene(path) {
  const direct = await fetch(path);
  if (direct.ok) {
    const buf = await direct.arrayBuffer();
    const head = new Uint8Array(buf, 0, Math.min(12, buf.byteLength));
    const magic = String.fromCharCode(...head.slice(0, 4));
    if (buf.byteLength > 1000 && magic === 'glTF') {
      const gltf = await new GLTFLoader().parseAsync(buf, '');
      return gltf.scene;
    }
  }
  const basePath = path.replace(/\.glb$/, '');
  const b64 = await loadGlbB64Parts(basePath);
  if (!b64) throw new Error(`Vehicle GLB unavailable: ${path}`);
  const gltf = await new GLTFLoader().parseAsync(b64ToArrayBuffer(b64), '');
  return gltf.scene;
}
