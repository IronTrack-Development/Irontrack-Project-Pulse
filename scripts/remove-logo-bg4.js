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
  
  // APPROACH: Flood fill from all edges
  // Mark all pixels reachable from edges that are "background-like" as transparent
  const visited = new Uint8Array(w * h);
  const isBackground = new Uint8Array(w * h);
  
  function isBgLike(i) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const brightness = (r + g + b) / 3;
    // Background is dark brownish gray: ~60-110 brightness, low saturation
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    
    // Background: low saturation, moderate brightness (50-130)
    // Also catches the lighter gray streaks (up to ~140)
    if (saturation < 0.2 && brightness > 40 && brightness < 145) return true;
    return false;
  }
  
  // BFS flood fill from all edge pixels
  const queue = [];
  
  // Add all edge pixels
  for (let x = 0; x < w; x++) {
    queue.push(x); // top row
    queue.push((h - 1) * w + x); // bottom row
  }
  for (let y = 0; y < h; y++) {
    queue.push(y * w); // left col
    queue.push(y * w + (w - 1)); // right col
  }
  
  while (queue.length > 0) {
    const pos = queue.shift();
    if (visited[pos]) continue;
    visited[pos] = 1;
    
    const i = pos * 4;
    if (!isBgLike(i)) continue;
    
    isBackground[pos] = 1;
    
    const x = pos % w;
    const y = Math.floor(pos / w);
    
    // 4-connected neighbors
    if (x > 0) queue.push(pos - 1);
    if (x < w - 1) queue.push(pos + 1);
    if (y > 0) queue.push(pos - w);
    if (y < h - 1) queue.push(pos + w);
  }
  
  // Apply transparency
  for (let pos = 0; pos < w * h; pos++) {
    if (isBackground[pos]) {
      const i = pos * 4;
      data[i + 3] = 0;
    }
  }
  
  // Soften edges: for non-background pixels adjacent to background, apply partial alpha
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const pos = y * w + x;
      if (isBackground[pos]) continue;
      
      // Count background neighbors in 3x3
      let bgNeighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (isBackground[(y + dy) * w + (x + dx)]) bgNeighbors++;
        }
      }
      
      if (bgNeighbors >= 4) {
        // Edge pixel — partial transparency for smooth blending
        data[pos * 4 + 3] = Math.floor(data[pos * 4 + 3] * (1 - bgNeighbors / 12));
      }
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  
  // Crop to content
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
  
  const pad = 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  
  const cropCanvas = createCanvas(maxX - minX + 1, maxY - minY + 1);
  const cropCtx = cropCanvas.getContext('2d');
  cropCtx.drawImage(canvas, minX, minY, maxX - minX + 1, maxY - minY + 1, 0, 0, maxX - minX + 1, maxY - minY + 1);
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'public', 'logo-irontrack.png'),
    cropCanvas.toBuffer('image/png')
  );
  console.log(`✅ Flood-fill BG removal done: ${maxX - minX + 1}x${maxY - minY + 1}`);
}

removeBg().catch(e => console.error(e));
