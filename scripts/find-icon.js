const { createCanvas, loadImage } = require('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack\\content\\node_modules\\canvas');
const fs = require('fs');
const path = require('path');

async function findIcon() {
  const src = await loadImage('C:\\Users\\Iront\\.openclaw\\media\\inbound\\ee089b55-0f43-4ed1-aeaa-d7680c07c95d.png');
  
  // Save full image for reference
  console.log('Source:', src.width, 'x', src.height);
  
  // The composite shows 4 icons at 16, 32, 48, and 512 sizes
  // arranged left to right with labels below
  // The 512x512 icon is the dominant element on the right ~60% of the image
  // Let's try different crop regions and save them
  
  const attempts = [
    { name: 'crop-a', x: 830, y: 30, w: 630, h: 630 },
    { name: 'crop-b', x: 870, y: 50, w: 590, h: 590 },
    { name: 'crop-c', x: 850, y: 20, w: 650, h: 650 },
    { name: 'crop-d', x: 810, y: 10, w: 680, h: 680 },
    { name: 'crop-e', x: 780, y: 0, w: 720, h: 720 },
  ];
  
  for (const { name, x, y, w, h } of attempts) {
    const canvas = createCanvas(512, 512);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(src, x, y, w, h, 0, 0, 512, 512);
    const outPath = path.join(__dirname, `${name}.png`);
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
    console.log(`Saved ${name} — crop(${x},${y},${w}x${h})`);
  }
}

findIcon().catch(e => console.error(e));
