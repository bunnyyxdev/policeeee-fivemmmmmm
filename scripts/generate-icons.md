# Generate PWA Icons

The PWA manifest requires PNG icons (192x192 and 512x512) for proper app icon display. Currently, we're using SVG as a temporary solution, but for best PWA support, you should create PNG icons.

## Quick Solution: Online Tool

1. Visit: https://realfavicongenerator.net/ or https://favicon.io/favicon-converter/
2. Upload `public/favicon.svg`
3. Generate icons at sizes: 192x192 and 512x512
4. Download and save to `public/`:
   - `icon-192x192.png`
   - `icon-512x512.png`

## Using ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
# Generate 192x192 icon
magick public/favicon.svg -resize 192x192 public/icon-192x192.png

# Generate 512x512 icon
magick public/favicon.svg -resize 512x512 public/icon-512x512.png
```

## Using Sharp (Node.js)

1. Install Sharp:
```bash
npm install --save-dev sharp
```

2. Create `scripts/generate-icons.ts`:
```typescript
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const svgPath = path.join(process.cwd(), 'public', 'favicon.svg');
  const outputDir = path.join(process.cwd(), 'public');

  // Generate 192x192
  await sharp(svgPath)
    .resize(192, 192)
    .png()
    .toFile(path.join(outputDir, 'icon-192x192.png'));

  // Generate 512x512
  await sharp(svgPath)
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, 'icon-512x512.png'));

  console.log('✅ Icons generated successfully!');
}

generateIcons().catch(console.error);
```

3. Run:
```bash
npx ts-node --project tsconfig.scripts.json scripts/generate-icons.ts
```

## After Generating Icons

Once you have the PNG icons, update `public/manifest.json`:

```json
"icons": [
  {
    "src": "/icon-192x192.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any maskable"
  },
  {
    "src": "/icon-512x512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any maskable"
  }
]
```

And update `app/layout.tsx` metadata to include the PNG icons again.
