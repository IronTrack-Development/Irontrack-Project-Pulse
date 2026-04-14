const { createCanvas, loadImage } = require('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack\\content\\node_modules\\canvas');
const fs = require('fs');
const path = require('path');

async function blackenBg() {
  const src = await loadImage('C:\\Users\\Iront\\.openclaw\\media\\inbound\\92959609-e040-4c86-acbe-c7b973cdd88c.png');
  const w = src.width, h = src.height;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(src, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Replace the gray background with #0B0B0D (site background)
  // Background is ~rgb(73-90, 72-85, 65-78)
  // Use flood fill from edges
  const visited = new Uint8Array(w * h);
  const isBackground = new Uint8Array(w * h);

  function isBgLike(pos) {
    const i = pos * 4;
    const r = data[i], g = data[i+1], b = data[i+2];
    const brightness = (r + g + b) / 3;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    return sat < 0.2 && brightness > 40 && brightness < 145;
  }

  const queue = [];
  for (let x = 0; x < w; x++) { queue.push(x); queue.push((h-1)*w+x); }
  for (let y = 0; y < h; y++) { queue.push(y*w); queue.push(y*w+(w-1)); }

  while (queue.length > 0) {
    const pos = queue.shift();
    if (pos < 0 || pos >= w*h || visited[pos]) continue;
    visited[pos] = 1;
    if (!isBgLike(pos)) continue;
    isBackground[pos] = 1;
    const x = pos % w, y = Math.floor(pos / w);
    if (x > 0) queue.push(pos-1);
    if (x < w-1) queue.push(pos+1);
    if (y > 0) queue.push(pos-w);
    if (y < h-1) queue.push(pos+w);
  }

  // Replace background pixels with #0B0B0D
  for (let pos = 0; pos < w*h; pos++) {
    if (isBackground[pos]) {
      data[pos*4] = 11;     // R
      data[pos*4+1] = 11;   // G
      data[pos*4+2] = 13;   // B
    }
  }

  // Also soften the transition — make near-bg pixels darker
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pos = y * w + x;
      if (isBackground[pos]) continue;
      // Check if adjacent to background
      let adjBg = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const np = (y+dy)*w+(x+dx);
          if (np >= 0 && np < w*h && isBackground[np]) adjBg++;
        }
      }
      if (adjBg > 8) {
        // Blend toward site bg color
        const i = pos * 4;
        const factor = Math.min(1, adjBg / 20);
        data[i] = Math.floor(data[i] * (1-factor) + 11 * factor);
        data[i+1] = Math.floor(data[i+1] * (1-factor) + 11 * factor);
        data[i+2] = Math.floor(data[i+2] * (1-factor) + 13 * factor);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Crop to content
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pos = y*w+x;
      if (!isBackground[pos]) {
        if (x < minX) minX = x; if (y < minY) minY = y;
        if (x > maxX) maxX = x; if (y > maxY) maxY = y;
      }
    }
  }
  const pad = 15;
  minX = Math.max(0, minX-pad); minY = Math.max(0, minY-pad);
  maxX = Math.min(w-1, maxX+pad); maxY = Math.min(h-1, maxY+pad);

  const cw = maxX-minX+1, ch = maxY-minY+1;
  const cc = createCanvas(cw, ch);
  const cctx = cc.getContext('2d');
  // Fill with site bg first
  cctx.fillStyle = '#0B0B0D';
  cctx.fillRect(0, 0, cw, ch);
  cctx.drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);

  fs.writeFileSync(path.join(__dirname, '..', 'public', 'logo-irontrack.png'), cc.toBuffer('image/png'));
  console.log(`✅ Done: ${cw}x${ch}`);
}

blackenBg().catch(e => console.error(e));
