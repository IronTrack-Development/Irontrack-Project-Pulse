const { createCanvas, loadImage } = require('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack\\content\\node_modules\\canvas');
const fs = require('fs');
const path = require('path');

async function fixIcon() {
  const src = await loadImage('C:\\Users\\Iront\\.openclaw\\media\\inbound\\ee089b55-0f43-4ed1-aeaa-d7680c07c95d.png');
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Previous crop picked up artifacts from the small icons on the left
  // Shift crop further right to avoid them, and nudge down for optical center
  // Icon bounds: (691,177) to (1390,807)
  // The small icons are at x < 690, so we need cropX > 690
  const centerX = 1055; // shifted right more
  const centerY = 502;  // shifted down more
  const halfSize = 340; // slightly tighter to avoid left-edge artifacts
  
  const cropX = Math.max(695, centerX - halfSize); // ensure we don't pick up small icons
  const cropY = centerY - halfSize;
  const cropSize = halfSize * 2;
  
  console.log(`Crop: (${cropX}, ${cropY}) size ${cropSize}`);

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
    
    // Fill with dark background matching the icon's own bg
    ctx.fillStyle = '#0D0D0E';
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
    
    ctx.drawImage(src, cropX, cropY, cropSize, cropSize, 0, 0, size, size);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, name), buffer);
    console.log(`✅ ${name} (${size}x${size}) — ${(buffer.length / 1024).toFixed(1)} KB`);
  }
  
  // Save review copy
  const tc = createCanvas(512, 512);
  const tctx = tc.getContext('2d');
  tctx.fillStyle = '#0D0D0E';
  tctx.fillRect(0, 0, 512, 512);
  const r = 80;
  tctx.beginPath();
  tctx.moveTo(r, 0); tctx.lineTo(512-r, 0); tctx.quadraticCurveTo(512, 0, 512, r);
  tctx.lineTo(512, 512-r); tctx.quadraticCurveTo(512, 512, 512-r, 512);
  tctx.lineTo(r, 512); tctx.quadraticCurveTo(0, 512, 0, 512-r);
  tctx.lineTo(0, r); tctx.quadraticCurveTo(0, 0, r, 0);
  tctx.closePath(); tctx.clip();
  tctx.drawImage(src, cropX, cropY, cropSize, cropSize, 0, 0, 512, 512);
  fs.writeFileSync(path.join(__dirname, 'icon-v3-review.png'), tc.toBuffer('image/png'));
  console.log('Saved icon-v3-review.png');
}

fixIcon().catch(e => console.error(e));
