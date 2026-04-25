import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = join(process.cwd(), 'public', 'icon.svg');
const svgBuffer = readFileSync(svgPath);

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = join(process.cwd(), 'public', 'icons', `icon-${size}x${size}.png`);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`Generated ${size}x${size} icon`);
  }
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
