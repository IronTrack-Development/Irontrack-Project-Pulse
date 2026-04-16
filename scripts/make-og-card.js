const { createCanvas, loadImage } = require('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack\\content\\node_modules\\canvas');
const fs = require('fs');
const path = require('path');

async function makeOGCard() {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Dark background matching app theme
  ctx.fillStyle = '#0B0B0D';
  ctx.fillRect(0, 0, width, height);

  // Subtle gradient overlay
  const grad = ctx.createRadialGradient(600, 250, 50, 600, 250, 500);
  grad.addColorStop(0, 'rgba(249, 115, 22, 0.08)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Load the actual IronTrack logo
  const logoPath = path.join(__dirname, '..', 'public', 'logo-irontrack.png');
  const logo = await loadImage(logoPath);
  
  // Draw logo centered, sized appropriately (crop bottom 12% to remove watermark)
  const logoSize = 220;
  const cropHeight = Math.floor(logo.height * 0.88);
  const logoX = (width - logoSize) / 2;
  const logoY = 120;
  ctx.drawImage(logo, 0, 0, logo.width, cropHeight, logoX, logoY, logoSize, logoSize);

  // "IRONTRACK" text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('IRONTRACK', width / 2, logoY + logoSize + 50);

  // "PROJECT PULSE" text in orange
  ctx.fillStyle = '#F97316';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif';
  ctx.fillText('PROJECT PULSE', width / 2, logoY + logoSize + 85);

  // Tagline
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '18px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif';
  ctx.fillText('Feel The Pulse Of Your Project', width / 2, logoY + logoSize + 125);

  // Bottom accent line
  const lineY = height - 40;
  const lineGrad = ctx.createLinearGradient(300, lineY, 900, lineY);
  lineGrad.addColorStop(0, '#F97316');
  lineGrad.addColorStop(1, '#1e3a5f');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(300, lineY);
  ctx.lineTo(900, lineY);
  ctx.stroke();

  // Save
  const outPath = path.join(__dirname, '..', 'public', 'og-share-card.png');
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ OG card generated: ${(buffer.length / 1024).toFixed(1)} KB`);
}

makeOGCard().catch(e => console.error('Error:', e));
