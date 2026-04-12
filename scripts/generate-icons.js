const { createCanvas, loadImage } = require('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack\\content\\node_modules\\canvas');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const src = await loadImage('C:\\Users\\Iront\\.openclaw\\media\\inbound\\ee089b55-0f43-4ed1-aeaa-d7680c07c95d.png');
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Best crop: the 512px icon from right side of composite — crop-e coordinates
  const cropX = 780;
  const cropY = 0;
  const cropSize = 720;
  
  const extractCanvas = createCanvas(cropSize, cropSize);
  const extractCtx = extractCanvas.getContext('2d');
  extractCtx.drawImage(src, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);
  
  // Generate each size needed for the web app
  const sizes = [
    { name: 'icon-512.png', size: 512 },
    { name: 'icon-192.png', size: 192 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon-48.png', size: 48 },
    { name: 'favicon-32.png', size: 32 },
    { name: 'favicon-16.png', size: 16 },
    { name: 'app icon logo.png', size: 512 },
    { name: 'Final Irontrack logo.PNG', size: 512 },
  ];
  
  for (const { name, size } of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(extractCanvas, 0, 0, cropSize, cropSize, 0, 0, size, size);
    const buffer = canvas.toBuffer('image/png');
    const outPath = path.join(publicDir, name);
    fs.writeFileSync(outPath, buffer);
    console.log(`✅ ${name} (${size}x${size}) — ${(buffer.length / 1024).toFixed(1)} KB`);
  }
  
  console.log('\nAll icons generated.');
}

generateIcons().catch(e => console.error('Error:', e));
