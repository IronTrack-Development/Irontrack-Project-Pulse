const { createCanvas, loadImage } = require('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack\\content\\node_modules\\canvas');
const fs = require('fs');
const path = require('path');

async function removeBg() {
  // Reload from original source
  const src = await loadImage('C:\\Users\\Iront\\.openclaw\\media\\inbound\\92959609-e040-4c86-acbe-c7b973cdd88c.png');
  const w = src.width;
  const h = src.height;
  
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(src, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  
  // Sample corner pixels to get the exact background color
  // Top-left corner
  const bgR = data[0], bgG = data[1], bgB = data[2];
  console.log(`Background sample: rgb(${bgR}, ${bgG}, ${bgB})`);
  
  // Also sample a few more points
  const samples = [
    [0, 0], [10, 10], [w-1, 0], [w-1, h-1], [0, h-1], [w/2, 0], [w/2, h-1]
  ];
  for (const [sx, sy] of samples) {
    const idx = (Math.floor(sy) * w + Math.floor(sx)) * 4;
    console.log(`  (${Math.floor(sx)},${Math.floor(sy)}): rgb(${data[idx]}, ${data[idx+1]}, ${data[idx+2]})`);
  }
  
  // The background is a consistent gray with subtle vertical texture
  // Use a more aggressive approach: calculate distance from the sampled bg color
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2];
      
      // Color distance from gray background
      // The background gray is roughly equal R/G/B in the 120-170 range
      const isGray = Math.abs(r - g) < 25 && Math.abs(g - b) < 25 && Math.abs(r - b) < 25;
      const brightness = (r + g + b) / 3;
      
      // Orange/gold detection: R much higher than B
      const isOrange = r > 150 && r > b * 1.5 && r > g * 1.1;
      const isWhiteHot = r > 220 && g > 200 && b > 150; // white-hot center of glow
      
      // Very dark metal
      const isDarkMetal = brightness < 60;
      
      // Medium metal with texture  
      const isMetal = brightness < 120 && !isGray;
      
      if (isOrange || isWhiteHot || isDarkMetal || isMetal) {
        // Keep — this is part of the logo
        continue;
      }
      
      if (isGray) {
        // Calculate how "background-like" this pixel is
        // Closer to the bg color = more transparent
        if (brightness > 90 && brightness < 200) {
          // Definitely background
          data[i + 3] = 0;
        } else if (brightness >= 200) {
          // Bright gray — could be highlight, partial transparency
          data[i + 3] = Math.min(255, Math.floor((brightness - 200) * 4));
        } else {
          // Dark gray — transition zone
          const factor = Math.max(0, (90 - brightness) / 90);
          data[i + 3] = Math.floor(factor * 255);
        }
      }
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  
  // Crop to content (remove transparent edges)
  // Find bounding box of non-transparent pixels
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 20) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  // Add small padding
  const pad = 10;
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
  console.log(`✅ Background removed and cropped: ${cropW}x${cropH}`);
}

removeBg().catch(e => console.error(e));
