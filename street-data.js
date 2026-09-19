async function gunzipText(stream) {
  return new Response(stream.pipeThrough(new DecompressionStream('gzip'))).text();
}

export async function loadVidhanaStreetData() {
  const json = await fetch('./vidhana-street-data.json');
  if (json.ok) {
    const text = await json.text();
    if (text.length > 1000 && !text.startsWith('LOAD_FROM') && !text.startsWith('@file')) {
      return JSON.parse(text);
    }
  }
  const b64 = await fetch('./vidhana-street-data.json.gz.b64');
  if (!b64.ok) throw Error('Vidhana street data unavailable');
  const raw = atob(await b64.text());
  const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
  return JSON.parse(await gunzipText(new Blob([bytes]).stream()));
}
