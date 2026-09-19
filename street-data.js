export async function loadVidhanaStreetData() {
  const json = await fetch('./vidhana-street-data.json');
  if (!json.ok) throw Error('Vidhana street data unavailable');
  const text = await json.text();
  if (text.length < 1000 || text.startsWith('LOAD_FROM') || text.startsWith('@file')) {
    throw Error('Vidhana street data unavailable');
  }
  return JSON.parse(text);
}
