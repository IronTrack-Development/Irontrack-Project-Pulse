const { createCanvas, loadImage } = require('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack\\content\\node_modules\\canvas');
const fs = require('fs');
const path = require('path');

async function fix() {
  const src = await loadImage('C:\\Users\\Iront\\.openclaw\\media\\inbound\\1577163c-17ba-4fd5-8028-09d0024e042a.png');
  const w = src.width, h = src.height;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(src, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    
    // Checkerboard is light gray (~204) and white (~255) alternating
    // Remove any pixel that's very light and low saturation (gray/white)
    const brightness = (r + g + b) / 3;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    
    if (brightness > 180 && sat < 0.1) {
      // White/light gray checkerboard — make transparent
      d[i+3] = 0;
    } else if (brightness > 150 && sat < 0.15) {
      // Transition zone — partial transparency
      const alpha = Math.floor(((180 - brightness) / 30) * 255);
      d[i+3] = Math.min(d[i+3], Math.max(0, alpha));
    }
  }

  ctx.putImageData(imgData, 0, 0);
  
  const outPath = path.join(__dirname, '..', 'public', 'logo-irontrack.png');
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log('✅ Checkerboard removed, true transparency applied');
}

fix().catch(e => console.error(e));
