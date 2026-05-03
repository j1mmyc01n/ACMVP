import sharp from 'sharp';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = join(process.cwd(), 'public', 'icon.svg');
const iconsDir = join(process.cwd(), 'public', 'icons');

async function generateIcons() {
  // Check if source SVG exists
  if (!existsSync(svgPath)) {
    console.error(`❌ Error: Icon source file not found at ${svgPath}`);
    console.error('Please create public/icon.svg before running this script.');
    process.exit(1);
  }

  // Create icons directory if it doesn't exist
  if (!existsSync(iconsDir)) {
    try {
      mkdirSync(iconsDir, { recursive: true });
      console.log(`✅ Created icons directory at ${iconsDir}`);
    } catch (error) {
      console.error(`❌ Error: Could not create icons directory: ${error.message}`);
      process.exit(1);
    }
  }

  // Read SVG file
  let svgBuffer;
  try {
    svgBuffer = readFileSync(svgPath);
  } catch (error) {
    console.error(`❌ Error: Could not read SVG file: ${error.message}`);
    process.exit(1);
  }

  // Generate icons
  for (const size of sizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${size}x${size} icon`);
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size} icon: ${error.message}`);
      process.exit(1);
    }
  }
  
  console.log('🎉 All icons generated successfully!');
}

generateIcons().catch((error) => {
  console.error(`❌ Unexpected error: ${error.message}`);
  process.exit(1);
});
