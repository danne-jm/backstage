import sharp from 'sharp';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Icon sizes for PWA
const sizes = [192, 512];

async function generateIcons() {
    // Try favicon.svg first (vector, best quality), fallback to apple-touch-icon.png
    let sourceIcon = join(publicDir, 'favicon.svg');
    
    if (!existsSync(sourceIcon)) {
        sourceIcon = join(publicDir, 'apple-touch-icon.png');
    }
    
    if (!existsSync(sourceIcon)) {
        console.error('No source icon found. Please ensure favicon.svg or apple-touch-icon.png exists in the public directory.');
        process.exit(1);
    }

    console.log('Generating PWA icons from:', sourceIcon);

    for (const size of sizes) {
        const outputPath = join(publicDir, `pwa-${size}x${size}.png`);

        await sharp(sourceIcon)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 },
            })
            .png()
            .toFile(outputPath);

        console.log(`Generated: pwa-${size}x${size}.png`);
    }

    // Generate maskable icon (with padding for safe area)
    const maskableSize = 512;
    const maskableOutputPath = join(publicDir, `pwa-maskable-${maskableSize}x${maskableSize}.png`);
    
    // Maskable icons need 10% padding on all sides (safe zone)
    const iconSize = Math.floor(maskableSize * 0.8);
    
    await sharp(sourceIcon)
        .resize(iconSize, iconSize, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .extend({
            top: Math.floor((maskableSize - iconSize) / 2),
            bottom: Math.ceil((maskableSize - iconSize) / 2),
            left: Math.floor((maskableSize - iconSize) / 2),
            right: Math.ceil((maskableSize - iconSize) / 2),
            background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png()
        .toFile(maskableOutputPath);
    
    console.log(`Generated: pwa-maskable-${maskableSize}x${maskableSize}.png`);

    console.log('PWA icons generated successfully!');
}

generateIcons().catch(console.error);
