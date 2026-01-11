import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');

// PWA icon sizes: 192 and 512 are required, 384 is recommended
// 96 is needed for PWA shortcut icons
const ICON_SIZES = [96, 192, 384, 512];

// Maskable icons need safe zone padding (10-20% per PWA spec).
// Using 10% as the minimum safe zone to maximize icon visibility.
// See: https://web.dev/articles/maskable-icon
const SAFE_ZONE_PERCENTAGE = 0.1;

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

// Maskable icons need safe zone padding for adaptive icon support
const createMaskableIconSvg = (size) => {
  const safeZone = size * SAFE_ZONE_PERCENTAGE;
  return createIconSvg(size, safeZone);
};

// Apple touch icon with extra padding for visual balance
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

// Helper to generate a single icon with specific error handling
async function generateIcon(filename, svg, outputDir) {
  try {
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    await writeFile(join(outputDir, filename), pngBuffer);
    console.log(`Generated ${filename}`);
  } catch (error) {
    console.error(`Failed to generate ${filename}:`, error.message);
    throw error;
  }
}

async function generateIcons() {
  try {
    await mkdir(iconsDir, { recursive: true });

    // Generate regular icons
    for (const size of ICON_SIZES) {
      const svg = createIconSvg(size);
      await generateIcon(`icon-${size}.png`, svg, iconsDir);
    }

    // Generate maskable icons
    for (const size of ICON_SIZES) {
      const svg = createMaskableIconSvg(size);
      await generateIcon(`icon-maskable-${size}.png`, svg, iconsDir);
    }

    // Generate Apple touch icon (180x180)
    const appleTouchSvg = createAppleTouchIconSvg(180);
    await generateIcon('apple-touch-icon.png', appleTouchSvg, publicDir);

    console.log('\nAll PWA icons generated successfully!');
  } catch (error) {
    console.error('Failed to generate PWA icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
