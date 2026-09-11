const fs = require('node:fs'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const read = name => JSON.parse(fs.readFileSync('qc/' + name));
const perf = read('district-winding-cumulative-performance.json');
const geometry = read('district-winding-candidate-test.json');
const equivalent = read('district-winding-hoist-test.json');
const baseline = fs.readFileSync('qc/district-winding-baseline.js');
const candidate = fs.readFileSync('qc/district-winding-candidate.js');
const accepted = fs.readFileSync('qc/district-winding-hoisted.js');
assert.equal(perf.passed, true, 'Whole-release performance gate must pass');
assert.equal(perf.runs.length, 8);
assert.equal(geometry.passed, true);
assert.equal(equivalent.passed, true);
assert.equal(sha(candidate), equivalent.hashes.candidate);
assert.equal(sha(accepted), equivalent.hashes.hoisted);
assert.equal(sha(candidate), geometry.sourceHashes.candidate);
assert.equal(sha(baseline), geometry.sourceHashes.baseline);
assert.equal(perf.snapshotManifest.snapshots.candidate.files.find(f => f.path === 'district.js').sha256, sha(candidate));
for (const run of perf.runs) {
  assert.deepEqual(run.errors, []);
  assert.deepEqual(run.missing, []);
  if (run.mode === 'candidate') assert.equal(run.loaded.find(f => f.file === 'district.js').sha256, sha(candidate));
}
const runtime = fs.readFileSync('district.js');
assert.equal(runtime.toString().replace(/\r\n/g, '\n'), baseline.toString().replace(/\r\n/g, '\n'), 'Runtime changed beyond Git checkout line endings since reviewed baseline');
fs.writeFileSync('district.js', accepted);
const receipt = {
  passed: true, before: sha(runtime), baseline: sha(baseline), baselineEquivalentAfterCRLF: true, benchmarkCandidate: sha(candidate), after: sha(accepted),
  comparisons: perf.comparisons,
  scope: 'Root reviewed ground, facade and aerial images. Hoisted ring-area calculation preserves exact generated geometry/materials and render code; startup timing not measured. No deployment.'
};
fs.writeFileSync('qc/district-winding-promotion.json', JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt));
