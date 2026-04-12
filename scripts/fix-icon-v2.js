const { createCanvas, loadImage } = require('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack\\content\\node_modules\\canvas');
const fs = require('fs');
const path = require('path');

async function fixIcon() {
  const src = await loadImage('C:\\Users\\Iront\\.openclaw\\media\\inbound\\ee089b55-0f43-4ed1-aeaa-d7680c07c95d.png');
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Icon bounds from scan: (691,177) to (1390,807), center ~(1040, 492)
  // Shift crop 15px right and 10px down for better optical centering
  const centerX = 1040 + 15;
  const centerY = 492 + 10;
  const halfSize = 370; // slightly larger to give breathing room
  
  const cropX = centerX - halfSize;
  const cropY = centerY - halfSize;
  const cropSize = halfSize * 2;
  
  console.log(`Crop: (${cropX}, ${cropY}) size ${cropSize}`);

  // Generate all sizes with rounded corners
  const sizes = [
    { name: 'icon-512.png', size: 512, radius: 80 },
    { name: 'icon-192.png', size: 192, radius: 30 },
    { name: 'apple-touch-icon.png', size: 180, radius: 28 },
    { name: 'favicon-48.png', size: 48, radius: 8 },
    { name: 'favicon-32.png', size: 32, radius: 6 },
    { name: 'favicon-16.png', size: 16, radius: 3 },
    { name: 'app icon logo.png', size: 512, radius: 80 },
    { name: 'Final Irontrack logo.PNG', size: 512, radius: 80 },
  ];
  
  for (const { name, size, radius } of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Fill with black first (for any gaps at edges)
    ctx.fillStyle = '#0B0B0D';
    ctx.fillRect(0, 0, size, size);
    
    // Draw rounded rect clip path
    const r = radius;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();
    
    // Draw the icon centered
    ctx.drawImage(src, cropX, cropY, cropSize, cropSize, 0, 0, size, size);
    
    const buffer = canvas.toBuffer('image/png');
    const outPath = path.join(publicDir, name);
    fs.writeFileSync(outPath, buffer);
    console.log(`✅ ${name} (${size}x${size}, r=${radius}) — ${(buffer.length / 1024).toFixed(1)} KB`);
  }
  
  // Also save a test version for review
  const testCanvas = createCanvas(512, 512);
  const testCtx = testCanvas.getContext('2d');
  testCtx.fillStyle = '#0B0B0D';
  testCtx.fillRect(0, 0, 512, 512);
  const r = 80;
  testCtx.beginPath();
  testCtx.moveTo(r, 0);
  testCtx.lineTo(512 - r, 0);
  testCtx.quadraticCurveTo(512, 0, 512, r);
  testCtx.lineTo(512, 512 - r);
  testCtx.quadraticCurveTo(512, 512, 512 - r, 512);
  testCtx.lineTo(r, 512);
  testCtx.quadraticCurveTo(0, 512, 0, 512 - r);
  testCtx.lineTo(0, r);
  testCtx.quadraticCurveTo(0, 0, r, 0);
  testCtx.closePath();
  testCtx.clip();
  testCtx.drawImage(src, cropX, cropY, cropSize, cropSize, 0, 0, 512, 512);
  fs.writeFileSync(path.join(__dirname, 'icon-final-review.png'), testCanvas.toBuffer('image/png'));
  console.log('Saved icon-final-review.png for review');
}

fixIcon().catch(e => console.error(e));
