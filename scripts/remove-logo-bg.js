const { createCanvas, loadImage } = require('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack\\content\\node_modules\\canvas');
const fs = require('fs');
const path = require('path');

async function removeBg() {
  const src = await loadImage('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack-pulse\\public\\logo-irontrack.png');
  const w = src.width;
  const h = src.height;
  
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(src, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  
  // The background is a gray/silver tone (~128-180 RGB, relatively equal R/G/B)
  // The logo is dark metallic (low RGB) with bright orange/gold highlights (high R, medium G, low B)
  // Strategy: make pixels transparent if they're grayish and not part of the logo/glow
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate how "gray" this pixel is (low saturation)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const brightness = (r + g + b) / 3;
    
    // Gray background: low saturation, medium-high brightness
    // Logo metal: low saturation but darker
    // Orange glow: high saturation, warm colors
    
    // Remove if: grayish (low saturation) AND medium-bright (background zone)
    // Keep if: saturated (orange/gold) OR very dark (logo metal edges) OR very bright glow
    
    if (saturation < 0.15 && brightness > 100 && brightness < 200) {
      // Pure gray background — make fully transparent
      data[i + 3] = 0;
    } else if (saturation < 0.1 && brightness >= 200) {
      // Light gray near edges — fade out
      data[i + 3] = Math.max(0, Math.floor((saturation / 0.1) * 255));
    } else if (saturation < 0.12 && brightness > 80 && brightness < 210) {
      // Slightly colored gray — partial transparency based on distance from pure gray
      const alpha = Math.min(255, Math.floor((saturation / 0.12) * 255 + (210 - brightness) / 130 * 100));
      data[i + 3] = alpha;
    }
    // Everything else (orange glow, dark metal, bright highlights) stays fully opaque
  }
  
  ctx.putImageData(imgData, 0, 0);
  
  const outPath = path.join(__dirname, '..', 'public', 'logo-irontrack.png');
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log('✅ Logo background removed, saved to', outPath);
  console.log('Size:', w, 'x', h);
}

removeBg().catch(e => console.error(e));
