const sharp = require('sharp');
const path = require('path');

const ogSvg = `<svg viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0B0B0D"/>
  <rect x="450" y="115" width="300" height="300" rx="66" fill="#E85D1C"/>
  <polyline points="480,265 535,265 553,205 578,325 603,175 628,340 646,265 708,265 722,235 735,265" stroke="#F5F3EE" stroke-width="21" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <text x="600" y="480" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" font-weight="800" letter-spacing="-1">
    <tspan fill="#F5F3EE">Iron</tspan><tspan fill="#E85D1C">Track</tspan>
  </text>
  <text x="600" y="520" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#6B7280">Project Pulse</text>
  <text x="600" y="570" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#4B5563">Run Your Job. Don't Chase It.</text>
</svg>`;

sharp(Buffer.from(ogSvg))
  .resize(1200, 630)
  .png()
  .toFile(path.join(__dirname, '..', 'public', 'og-share-card.png'))
  .then(() => console.log('Generated og-share-card.png'))
  .catch(console.error);
