import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');

// SVG icon with app branding colors (amber/orange theme)
const createIconSvg = (size, padding = 0) => {
  const viewBox = 24;
  const scale = (size - padding * 2) / viewBox;
  const offset = padding;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0f172a"/>
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <path d="M17.5 8C17.5 8 19 9.5 19 12C19 14.5 17.5 16 17.5 16" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20.5 5C20.5 5 23 7.5 23 12C23 16.5 20.5 19 20.5 19" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6.5 8C6.5 8 5 9.5 5 12C5 14.5 6.5 16 6.5 16" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3.5 5C3.5 5 1 7.5 1 12C1 16.5 3.5 19 3.5 19" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="#d97706" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
};

// Maskable icons need safe zone padding (about 10% on each side)
const createMaskableIconSvg = (size) => {
  const safeZone = size * 0.1;
  return createIconSvg(size, safeZone);
};

// Apple touch icon with rounded corners background
const createAppleTouchIconSvg = (size) => {
  const viewBox = 24;
  const padding = size * 0.15;
  const scale = (size - padding * 2) / viewBox;
  const offset = padding;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0f172a"/>
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <path d="M17.5 8C17.5 8 19 9.5 19 12C19 14.5 17.5 16 17.5 16" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20.5 5C20.5 5 23 7.5 23 12C23 16.5 20.5 19 20.5 19" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6.5 8C6.5 8 5 9.5 5 12C5 14.5 6.5 16 6.5 16" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3.5 5C3.5 5 1 7.5 1 12C1 16.5 3.5 19 3.5 19" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="#d97706" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
};

async function generateIcons() {
  await mkdir(iconsDir, { recursive: true });

  const sizes = [192, 512];

  // Generate regular icons
  for (const size of sizes) {
    const svg = createIconSvg(size);
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    await writeFile(join(iconsDir, `icon-${size}.png`), pngBuffer);
    console.log(`Generated icon-${size}.png`);
  }

  // Generate maskable icons
  for (const size of sizes) {
    const svg = createMaskableIconSvg(size);
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    await writeFile(join(iconsDir, `icon-maskable-${size}.png`), pngBuffer);
    console.log(`Generated icon-maskable-${size}.png`);
  }

  // Generate Apple touch icon (180x180)
  const appleTouchSvg = createAppleTouchIconSvg(180);
  const appleTouchBuffer = await sharp(Buffer.from(appleTouchSvg))
    .png()
    .toBuffer();

  await writeFile(join(publicDir, 'apple-touch-icon.png'), appleTouchBuffer);
  console.log('Generated apple-touch-icon.png');

  console.log('\nAll PWA icons generated successfully!');
}

generateIcons().catch(console.error);
