const { createCanvas, loadImage } = require('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack\\content\\node_modules\\canvas');
const fs = require('fs');
const path = require('path');

async function fixIcon() {
  const src = await loadImage('C:\\Users\\Iront\\.openclaw\\media\\inbound\\ee089b55-0f43-4ed1-aeaa-d7680c07c95d.png');
  
  console.log('Source:', src.width, 'x', src.height);
  
  // The composite image is 1536x1024
  // It has 4 icons: 16px, 32px, 48px on the left, and the big 512px on the right
  // Let's scan the right half to find the actual icon boundaries by looking for non-black pixels
  
  const scanCanvas = createCanvas(src.width, src.height);
  const scanCtx = scanCanvas.getContext('2d');
  scanCtx.drawImage(src, 0, 0);
  const imgData = scanCtx.getImageData(0, 0, src.width, src.height);
  
  // Find bounding box of the large icon (right half of image)
  let minX = src.width, minY = src.height, maxX = 0, maxY = 0;
  const startX = Math.floor(src.width * 0.45); // Start scanning from ~45% width
  
  for (let y = 0; y < src.height; y++) {
    for (let x = startX; x < src.width; x++) {
      const idx = (y * src.width + x) * 4;
      const r = imgData.data[idx];
      const g = imgData.data[idx + 1];
      const b = imgData.data[idx + 2];
      // Check if pixel is not near-black (threshold 20)
      if (r > 20 || g > 20 || b > 20) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  console.log(`Icon bounds: (${minX},${minY}) to (${maxX},${maxY})`);
  console.log(`Size: ${maxX - minX} x ${maxY - minY}`);
  
  // Add some padding and make it square
  const iconW = maxX - minX;
  const iconH = maxY - minY;
  const iconSize = Math.max(iconW, iconH);
  const centerX = minX + iconW / 2;
  const centerY = minY + iconH / 2;
  
  // Crop centered square with small padding
  const pad = 10;
  const cropSize = iconSize + pad * 2;
  const cropX = Math.max(0, centerX - cropSize / 2);
  const cropY = Math.max(0, centerY - cropSize / 2);
  
  console.log(`Centered crop: (${Math.round(cropX)},${Math.round(cropY)}) size ${Math.round(cropSize)}`);
  
  // Extract and save test
  const testCanvas = createCanvas(512, 512);
  const testCtx = testCanvas.getContext('2d');
  testCtx.drawImage(src, cropX, cropY, cropSize, cropSize, 0, 0, 512, 512);
  fs.writeFileSync(path.join(__dirname, 'icon-test-centered.png'), testCanvas.toBuffer('image/png'));
  console.log('Saved icon-test-centered.png');
  
  // Also try with rounded corners
  const roundCanvas = createCanvas(512, 512);
  const roundCtx = roundCanvas.getContext('2d');
  const radius = 80; // ~15% corner radius for app icon feel
  
  // Draw rounded rect clip path
  roundCtx.beginPath();
  roundCtx.moveTo(radius, 0);
  roundCtx.lineTo(512 - radius, 0);
  roundCtx.quadraticCurveTo(512, 0, 512, radius);
  roundCtx.lineTo(512, 512 - radius);
  roundCtx.quadraticCurveTo(512, 512, 512 - radius, 512);
  roundCtx.lineTo(radius, 512);
  roundCtx.quadraticCurveTo(0, 512, 0, 512 - radius);
  roundCtx.lineTo(0, radius);
  roundCtx.quadraticCurveTo(0, 0, radius, 0);
  roundCtx.closePath();
  roundCtx.clip();
  
  roundCtx.drawImage(src, cropX, cropY, cropSize, cropSize, 0, 0, 512, 512);
  fs.writeFileSync(path.join(__dirname, 'icon-test-rounded.png'), roundCanvas.toBuffer('image/png'));
  console.log('Saved icon-test-rounded.png');
}

fixIcon().catch(e => console.error(e));
