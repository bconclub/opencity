const fs = require('fs');
const path = require('path');

const variants = [
  { id: 'standard', label: 'Standard Wheel', scale: [1, 1, 1] },
  { id: 'large', label: 'Large Wheel', scale: [1.2, 1.2, 1.2] },
  { id: 'small', label: 'Small Wheel', scale: [0.8, 0.8, 0.8] }
];

console.log('Wheel Variants Benchmark');
console.log('========================');

variants.forEach((v, i) => {
  console.log(`\n[${i + 1}] ${v.id}: ${v.label}`);
  console.log(`    Scale: [${v.scale.join(', ')}]`);
});

console.log('\nBenchmark complete.');
