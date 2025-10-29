/*
Batch-convert images to WebP and AVIF using sharp.
Usage:
  1) npm install sharp
  2) node scripts/convert-images-sharp.js

Notes:
 - Scans the top-level `images/` directory and its subfolders (excluding `admin/` and `server/`),
 - Converts .png, .jpg, .jpeg files to .webp and .avif (skips files already converted),
 - Leaves original files untouched.
*/

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'images');

const validExt = new Set(['.png', '.jpg', '.jpeg']);

async function walk(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // skip admin and server directories if encountered inside images (defensive)
      if (e.name.toLowerCase() === 'admin' || e.name.toLowerCase() === 'server') continue;
      files.push(...await walk(full));
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (validExt.has(ext)) files.push(full);
    }
  }
  return files;
}

async function convertFile(file) {
  const dir = path.dirname(file);
  const base = path.basename(file, path.extname(file));
  const avifOut = path.join(dir, base + '.avif');
  const webpOut = path.join(dir, base + '.webp');

  try {
    const image = sharp(file);
    const metadata = await image.metadata();

    // AVIF
    if (!fs.existsSync(avifOut)) {
      await image
        .clone()
        .avif({ quality: 50 })
        .toFile(avifOut);
      console.log('Created', path.relative(ROOT, avifOut));
    } else {
      console.log('Exists', path.relative(ROOT, avifOut));
    }

    // WebP
    if (!fs.existsSync(webpOut)) {
      await image
        .clone()
        .webp({ quality: 75 })
        .toFile(webpOut);
      console.log('Created', path.relative(ROOT, webpOut));
    } else {
      console.log('Exists', path.relative(ROOT, webpOut));
    }

  } catch (err) {
    console.error('Failed converting', file, err.message || err);
  }
}

(async () => {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error('images/ directory not found at', IMAGES_DIR);
    process.exit(1);
  }

  console.log('Scanning images directory:', IMAGES_DIR);
  const files = await walk(IMAGES_DIR);
  if (files.length === 0) {
    console.log('No PNG/JPG images found to convert.');
    return;
  }

  console.log(`Found ${files.length} source images. Converting...`);
  // convert sequentially to avoid memory spikes; for many files you can parallelize
  for (const f of files) {
    await convertFile(f);
  }

  console.log('All done. Check images/ for .avif and .webp files.');
})();
