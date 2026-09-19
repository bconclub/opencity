export async function loadVidhanaStreetData() {
  async function parseResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const isGzip = response.url.endsWith('.json.gz') || contentType.includes('gzip');
    const text = isGzip
      ? await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).text()
      : await response.text();
    if (text.length < 1000 || text.startsWith('LOAD_FROM') || text.startsWith('@file')) {
      throw Error('Vidhana street data unavailable');
    }
    return JSON.parse(text);
  }

  // Prefer gzip on reconcile branch — full JSON may lag GitHub MCP push limits.
  let response = await fetch('./vidhana-street-data.json.gz');
  if (response.ok) return parseResponse(response);

  response = await fetch('./vidhana-street-data.json');
  if (!response.ok) throw Error('Vidhana street data unavailable');
  return parseResponse(response);
}
