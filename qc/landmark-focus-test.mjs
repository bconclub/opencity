import assert from 'node:assert/strict';
import { buildFocusTargets, findFocusTarget } from './landmark-focus-candidate.js';

const feature = (id, height, size, extra = {}) => ({ properties: { osm_id: id, height, ...extra },
  geometry: { type: 'Polygon', coordinates: [[[0,0],[size,0],[size,size],[0,size],[0,0]]] } });
const features = [feature('ordinary', 12, 10), feature('crown', 46, 4), feature('removed-core', 47, 2)];
const original = structuredClone(features);
const model = { displayParts: { crown: { base: 28.1, height: 39.8 }, 'removed-core': null },
  extraFocusTargets: [{ id: 'stairs', name: 'Entrance stairs', base: 0, height: 6.75,
    rings: [[[20,0],[25,0],[25,5],[20,5]]] }] };
const targets = buildFocusTargets(features, point => [...point], model);
assert.deepEqual(features, original, 'Source properties and footprints must not change');
assert.equal(targets.length, 3);
assert.equal(targets[0].height, 12);
assert.equal(targets[0].source, 'OpenStreetMap');
assert.equal(targets[1].id, 'building-1', 'Stable IDs survive removed parts');
assert.equal(targets[1].height, 39.8);
assert.equal(targets[1].base, 28.1);
assert.equal(targets[1].properties.height, 46, 'Original mapped height retained separately');
assert.ok(!targets.some(target => target.properties?.osm_id === 'removed-core'));
const inPoly = ([x,y], [ring]) => x > ring[0][0] && x < ring[1][0] && y > ring[0][1] && y < ring[2][1];
const area = ring => (ring[1][0] - ring[0][0]) * (ring[2][1] - ring[0][1]);
assert.equal(findFocusTarget(targets, [1,1], 39.8, inPoly, area)?.id, 'building-1');
assert.equal(findFocusTarget(targets, [1,1], 46, inPoly, area), null, 'No invisible former dome top');
assert.equal(findFocusTarget(targets, [22,2], 6.75, inPoly, area)?.id, 'stairs');
assert.equal(findFocusTarget(targets, [1,1], 8, inPoly, area)?.id, 'building-0');
assert.equal(findFocusTarget(targets, [1,1], NaN, inPoly, area), null);
const reversed = targets.map(target => ({ ...target, rings: target.rings.map(ring => [...ring].reverse()) }));
assert.equal(findFocusTarget(reversed, [1,1], 39, () => true, () => -16)?.id, 'building-1');
const invalid = buildFocusTargets(features, point => [...point], {
  displayParts: { crown: { base: 40, height: 20 }, 'removed-core': { visible: false } },
  extraFocusTargets: [{ id: 'bad', base: 0, height: Infinity, rings: [] }],
});
assert.equal(invalid[1].height, 46, 'Invalid override falls back to mapped display height');
assert.equal(invalid.length, 2);
const visibleOnly=buildFocusTargets(features,point=>[...point],{},new Set([features[1]]));
assert.equal(visibleOnly.length,1);
assert.equal(visibleOnly[0].id,'building-1','Filtering invisible geometry keeps stable IDs');
targets[2].rings[0][0][0] = 99;
assert.equal(model.extraFocusTargets[0].rings[0][0][0], 20, 'Extra footprints copied');
console.log('PASS: displayed heights, removed core, stable IDs, source immutability, stairs, malformed metadata');
