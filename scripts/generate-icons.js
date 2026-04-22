const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// SVG for the app icon (orange bg + cream pulse)
const appIconSvg = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#E85D1C"/>
  <polyline points="51,256 143,256 174,154 215,358 256,102 297,384 328,256 420,256 451,205 471,256" stroke="#F5F3EE" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

// SVG for favicon (thicker stroke for small sizes)
const faviconSvg = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="14" fill="#E85D1C"/>
  <polyline points="6,32 18,32 22,19 27,45 32,13 37,48 41,32 53,32 56,26 59,32" stroke="#F5F3EE" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

async function generateIcons() {
  const sizes = [
    { name: 'icon-512.png', size: 512, svg: appIconSvg },
    { name: 'icon-192.png', size: 192, svg: appIconSvg },
    { name: 'apple-touch-icon.png', size: 180, svg: appIconSvg },
    { name: 'favicon-48.png', size: 48, svg: faviconSvg },
    { name: 'favicon-32.png', size: 32, svg: faviconSvg },
    { name: 'favicon-16.png', size: 16, svg: faviconSvg },
  ];

  for (const { name, size, svg } of sizes) {
    const outPath = path.join(publicDir, name);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${name} (${size}x${size})`);
  }

  // Generate favicon.ico from the 32px version (just use the PNG, browsers accept it)
  const favicon32 = await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toBuffer();
  
  // Also generate the src/app/favicon.ico (Next.js uses this)
  const appFaviconPath = path.join(__dirname, '..', 'src', 'app', 'favicon.ico');
  // For ICO compatibility, we'll just copy the 32px PNG — modern browsers handle PNG favicons
  fs.writeFileSync(appFaviconPath, favicon32);
  console.log('Generated src/app/favicon.ico');

  // Generate the logo-irontrack.png replacement (larger, for landing pages)
  const logoSvg = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="112" fill="#E85D1C"/>
    <polyline points="51,256 143,256 174,154 215,358 256,102 297,384 328,256 420,256 451,205 471,256" stroke="#F5F3EE" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`;
  
  await sharp(Buffer.from(logoSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'logo-irontrack.png'));
  console.log('Generated logo-irontrack.png (512x512)');

  // Generate app icon logo.png replacement
  await sharp(Buffer.from(logoSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'app icon logo.png'));
  console.log('Generated app icon logo.png (512x512)');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
