const fs = require('fs');
const path = require('path');

const previewHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Auto Wheel Preview</title>
  <style>
    body { margin: 0; background: #222; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script type="module">
    // Wheel preview placeholder
    const canvas = document.getElementById('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText('Auto Wheel Preview', 300, 300);
  </script>
</body>
</html>`;

const outputPath = path.join(__dirname, 'auto-wheel-preview.html');
fs.writeFileSync(outputPath, previewHtml);
console.log(`Preview HTML written to ${outputPath}`);
