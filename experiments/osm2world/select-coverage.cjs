const EARTH_M = 6371008.8;

// Select complete contiguous source segments. Never join separated pieces of
// one OSM way across an unselected gap. This is a conversion envelope, not a
// circular mesh clip; neighboring source endpoints remain outside the circle.
function selectCoverage(elements, center, radiusM) {
  if (!(radiusM > 0) || !center.every(Number.isFinite)) throw Error('Invalid coverage');
  const scale = Math.PI / 180 * EARTH_M;
  const nodes = new Map(elements.filter(e => e.type === 'node').map(e => [e.id, e]));
  const xy = n => [(n.lon - center[0]) * scale * Math.cos(center[1] * Math.PI / 180), (n.lat - center[1]) * scale];
  const touches = (a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(a[0] + t * dx, a[1] + t * dy) <= radiusM;
  };
  const containsOrigin = points => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i], b = points[j];
      if ((a[1] > 0) !== (b[1] > 0) && 0 < (b[0] - a[0]) * -a[1] / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  };
  const ways = [], provenance = [], missingNodeWays = [];
  let generatedId = -1;
  for (const way of elements.filter(e => e.type === 'way' && e.tags?.highway)) {
    if (way.nodes.some(id => !nodes.has(id))) { missingNodeWays.push(way.id); continue; }
    const points = way.nodes.map(id => xy(nodes.get(id)));
    if (points.length < 2) continue;
    const hits = points.slice(1).map((p, i) => touches(points[i], p));
    const closed = way.nodes[0] === way.nodes.at(-1);
    if (way.tags.area === 'yes' && closed) {
      if (hits.some(Boolean) || containsOrigin(points)) {
        ways.push(way); provenance.push({id: way.id, sourceWay: way.id, firstNodeIndex: 0, lastNodeIndex: way.nodes.length - 1, completeArea: true});
      }
      continue;
    }
    const runs = [];
    for (let i = 0; i < hits.length;) {
      if (!hits[i]) { i++; continue; }
      const first = i;
      while (i < hits.length && hits[i]) i++;
      runs.push([first, i]);
    }
    for (const [first, last] of runs) {
      // Keep original IDs whenever a way stays a single contiguous piece.
      const id = runs.length === 1 ? way.id : generatedId--;
      ways.push({...way, id, nodes: way.nodes.slice(first, last + 1)});
      provenance.push({id, sourceWay: way.id, firstNodeIndex: first, lastNodeIndex: last});
    }
  }
  const used = new Set(ways.flatMap(w => w.nodes));
  const selected = [...nodes.values()].filter(n => used.has(n.id));
  if (!selected.length) throw Error('No complete highway geometry in coverage');
  const bounds = [Math.min(...selected.map(n => n.lon)), Math.min(...selected.map(n => n.lat)), Math.max(...selected.map(n => n.lon)), Math.max(...selected.map(n => n.lat))];
  return {input: {version: 0.6, elements: [...selected, ...ways]}, provenance, missingNodeWays,
    stats: {selectionCenter: center, selectionRadiusM: radiusM, bounds,
      projectionOrigin: [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2],
      nodes: selected.length, ways: ways.length, sourceWays: new Set(provenance.map(p => p.sourceWay)).size,
      preciseCircularClip: false}};
}

module.exports = {selectCoverage};
