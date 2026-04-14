const { createCanvas, loadImage } = require('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack\\content\\node_modules\\canvas');
const fs = require('fs');
const path = require('path');

async function removeBg() {
  const src = await loadImage('C:\\Users\\Iront\\.openclaw\\media\\inbound\\92959609-e040-4c86-acbe-c7b973cdd88c.png');
  const w = src.width;
  const h = src.height;
  
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(src, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  
  // Background is rgb(73-90, 72-85, 65-78) — dark brownish gray
  // Logo: dark metal + bright orange/gold glow + white-hot highlights
  // Strategy: flood fill from edges to remove connected background
  
  // Build alpha channel based on color analysis
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2];
      const brightness = (r + g + b) / 3;
      
      // Orange/gold glow: R dominant, warm
      const isOrange = (r > 120 && r > b * 1.4) || (r > 180 && g > 100);
      // White-hot: very bright, slightly warm
      const isWhiteHot = brightness > 200 && r > 200;
      // Dark metallic logo: has texture, darker than background
      const isDarkMetal = brightness < 55;
      
      // The key insight: the background is ~rgb(75-90, 73-85, 65-78)
      // It's a narrow color range. If a pixel is close to this color, it's background.
      const bgDist = Math.sqrt(
        Math.pow(r - 80, 2) + Math.pow(g - 77, 2) + Math.pow(b - 70, 2)
      );
      
      if (isOrange || isWhiteHot) {
        // Definitely logo glow — keep fully opaque
        data[i + 3] = 255;
      } else if (isDarkMetal) {
        // Definitely logo metal — keep
        data[i + 3] = 255;
      } else if (bgDist < 20) {
        // Very close to background color — fully transparent
        data[i + 3] = 0;
      } else if (bgDist < 40) {
        // Transition zone — partial transparency
        data[i + 3] = Math.floor(((bgDist - 20) / 20) * 255);
      } else {
        // Far from background — keep
        data[i + 3] = 255;
      }
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  
  // Find bounding box of visible pixels
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 10) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  const pad = 5;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  
  const cropCanvas = createCanvas(cropW, cropH);
  const cropCtx = cropCanvas.getContext('2d');
  cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  
  const outPath = path.join(__dirname, '..', 'public', 'logo-irontrack.png');
  fs.writeFileSync(outPath, cropCanvas.toBuffer('image/png'));
  console.log(`✅ Done: ${cropW}x${cropH}, saved`);
}

removeBg().catch(e => console.error(e));
