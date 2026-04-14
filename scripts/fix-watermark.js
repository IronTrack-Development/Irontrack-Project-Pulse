const { createCanvas, loadImage } = require('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack\\content\\node_modules\\canvas');
const fs = require('fs');
const path = require('path');

async function fixIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Load the 512px icon
  const src = await loadImage(path.join(publicDir, 'icon-512.png'));
  const srcWidth = src.width;
  const srcHeight = src.height;
  
  console.log(`Source: ${srcWidth}x${srcHeight}`);
  
  // Crop: take the top 90% of the image to cut off the "512x512" watermark at the bottom
  // Then stretch to fill the square (the logo is centered so this works)
  const cropHeight = Math.floor(srcHeight * 0.88); // cut bottom 12%
  
  // Create a clean source canvas
  const cleanCanvas = createCanvas(srcWidth, srcWidth);
  const cleanCtx = cleanCanvas.getContext('2d');
  
  // Fill with the dark background color from the icon
  cleanCtx.fillStyle = '#1a1510';
  cleanCtx.fillRect(0, 0, srcWidth, srcWidth);
  
  // Draw the cropped image centered vertically
  const yOffset = Math.floor((srcWidth - cropHeight) / 2);
  cleanCtx.drawImage(src, 0, 0, srcWidth, cropHeight, 0, yOffset, srcWidth, cropHeight);
  
  // Generate all sizes
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
    ctx.drawImage(cleanCanvas, 0, 0, srcWidth, srcWidth, 0, 0, size, size);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, name), buffer);
    console.log(`✅ ${name} (${size}x${size}) — ${(buffer.length / 1024).toFixed(1)} KB`);
  }
  
  console.log('\nAll icons regenerated without watermark.');
}

fixIcons().catch(e => console.error('Error:', e));
