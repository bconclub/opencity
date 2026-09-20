const assert = require('node:assert/strict');
const {selectCoverage} = require('./select-coverage.cjs');
const m = 180 / (Math.PI * 6371008.8);
const node = (id, x, y) => ({type: 'node', id, lon: x * m, lat: y * m});
const way = (id, nodes, tags = {}) => ({type: 'way', id, nodes, tags: {highway: 'service', ...tags}});
// A road crosses the circle even though neither endpoint lies inside it.
let result = selectCoverage([node(1, -200, 0), node(2, 200, 0), way(10, [1, 2])], [0, 0], 100);
assert.equal(result.stats.ways, 1);
// A way exits and reenters: retain two source pieces without invented shortcut.
const reentry = [node(1, 0, 0), node(2, 200, 0), node(3, 200, 300), node(4, -200, 300), node(5, -200, 0), node(6, 0, 0), way(11, [1, 2, 3, 4, 5, 6])];
result = selectCoverage(reentry, [0, 0], 100);
assert.deepEqual(result.input.elements.filter(e => e.type === 'way').map(w => w.nodes), [[1, 2], [5, 6]]);
assert.equal(new Set(result.provenance.map(p => p.id)).size, 2);
assert(result.provenance.every(p => p.sourceWay === 11));
// Preserve an enclosing mapped area, even with all its edges outside the circle.
const area = [node(1, -200, -200), node(2, 200, -200), node(3, 200, 200), node(4, -200, 200), way(12, [1, 2, 3, 4, 1], {highway: 'pedestrian', area: 'yes'})];
result = selectCoverage(area, [0, 0], 100);
assert.deepEqual(result.input.elements.at(-1).nodes, [1, 2, 3, 4, 1]);
assert(result.provenance[0].completeArea);
// Missing references must never silently bridge two surviving nodes.
result = selectCoverage([...area, way(13, [1, 999, 2])], [0, 0], 100);
assert.deepEqual(result.missingNodeWays, [13]);
assert.equal(result.stats.ways, 1);
console.log('Coverage selection: crossing segments, separated runs, complete areas and missing references passed');
