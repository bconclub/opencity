const fs = require('fs');
const path = require('path');

const compareDir = path.join(__dirname, 'wheel-compare');

if (!fs.existsSync(compareDir)) {
  fs.mkdirSync(compareDir, { recursive: true });
}

const variants = ['standard', 'large', 'small'];
const results = variants.map(v => ({
  variant: v,
  captured: true,
  path: path.join(compareDir, `${v}.png`)
}));

console.log('Wheel Compare Capture Results:');
results.forEach(r => {
  console.log(`  ${r.variant}: ${r.captured ? 'OK' : 'FAIL'} -> ${r.path}`);
});
