const fs = require('fs');
const path = require('path');

const componentsPath = path.join(__dirname, 'auto-wheel-components.json');
const components = JSON.parse(fs.readFileSync(componentsPath, 'utf8'));

console.log('Auto Wheel Components Benchmark');
console.log('=============================');
console.log(`Version: ${components.version}`);
console.log(`Components: ${components.components.length}`);
console.log(`Materials: ${components.materials.length}`);

components.components.forEach((c, i) => {
  console.log(`\n[${i + 1}] ${c.id}: ${c.label}`);
  console.log(`    Mesh: ${c.mesh}`);
  console.log(`    Materials: ${c.materials.join(', ')}`);
});

console.log('\nBenchmark complete.');
