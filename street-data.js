async function gunzipText(stream) {
  return new Response(stream.pipeThrough(new DecompressionStream('gzip'))).text();
}

async function fetchAscii(path) {
  const res = await fetch(path);
  if (!res.ok) return null;
  const text = await res.text();
  if (!text || text.length < 100 || text.startsWith('LOAD_FROM') || text.startsWith('REQUIRE_FROM')) return null;
  return text;
}

async function loadGzipB64Parts() {
  const single = await fetchAscii('./vidhana-street-data.json.gz.b64');
  if (single && !single.startsWith('#')) return single;
  const parts = [];
  for (let i = 1; i <= 32; i += 1) {
    const chunk = await fetchAscii(`./vidhana-street-data.json.gz.b64.part${i}`);
    if (!chunk) break;
    parts.push(chunk);
  }
  return parts.length ? parts.join('') : null;
}

async function decodeGzipB64(b64) {
  const raw = atob(b64);
  const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
  return JSON.parse(await gunzipText(new Blob([bytes]).stream()));
}

export async function loadVidhanaStreetData() {
  // Prefer regen b64 shards when present; plain JSON is legacy fallback only.
  const b64 = await loadGzipB64Parts();
  if (b64) return decodeGzipB64(b64);
  const json = await fetch('./vidhana-street-data.json');
  if (json.ok) {
    const text = await json.text();
    if (text.length > 1000 && !text.startsWith('LOAD_FROM') && !text.startsWith('@file')) {
      return JSON.parse(text);
    }
  }
  throw Error('Vidhana street data unavailable');
}
