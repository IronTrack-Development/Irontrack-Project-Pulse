const { createCanvas, loadImage } = require('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack\\content\\node_modules\\canvas');
const fs = require('fs');
const path = require('path');

async function fixFavicon() {
  const src = await loadImage('C:\\Users\\Iront\\.openclaw\\media\\inbound\\ee089b55-0f43-4ed1-aeaa-d7680c07c95d.png');
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Crop coords from v3 (good centering)
  const cropX = 715;
  const cropY = 162;
  const cropSize = 680;

  const sizes = [
    { name: 'icon-512.png', size: 512, radius: 100 },
    { name: 'icon-192.png', size: 192, radius: 38 },
    { name: 'apple-touch-icon.png', size: 180, radius: 36 },
    { name: 'favicon-48.png', size: 48, radius: 10 },
    { name: 'favicon-32.png', size: 32, radius: 7 },
    { name: 'favicon-16.png', size: 16, radius: 4 },
    { name: 'app icon logo.png', size: 512, radius: 100 },
    { name: 'Final Irontrack logo.PNG', size: 512, radius: 100 },
  ];
  
  for (const { name, size, radius } of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // TRANSPARENT background — this is key
    // The rounded rect clip means outside corners are transparent
    ctx.clearRect(0, 0, size, size);
    
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
    
    // Fill the clipped area with the icon background color first
    ctx.fillStyle = '#0D0D0E';
    ctx.fillRect(0, 0, size, size);
    
    // Draw the icon
    ctx.drawImage(src, cropX, cropY, cropSize, cropSize, 0, 0, size, size);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, name), buffer);
    console.log(`✅ ${name} (${size}x${size}, r=${radius}) — ${(buffer.length / 1024).toFixed(1)} KB`);
  }

  console.log('\nAll favicons regenerated with transparent rounded corners.');
}

fixFavicon().catch(e => console.error(e));
