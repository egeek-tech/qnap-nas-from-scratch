import { readdir, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const MAX_W = 1600;

// Optimise every raster in srcDir: resized webp + resized same-format fallback.
// SVGs are copied verbatim. hashFn(buf, name) writes the file and returns its public path.
// Returns a manifest keyed by "assets/<name>".
export async function optimizeAssets(srcDir, outDir, hashFn) {
  await mkdir(outDir, { recursive: true });
  const manifest = {};
  for (const name of await readdir(srcDir)) {
    const ext = path.extname(name).toLowerCase();
    const key = `assets/${name}`;
    const abs = path.join(srcDir, name);
    if (ext === '.svg') {
      const pub = await hashFn(await readFile(abs), name);
      manifest[key] = { webp: pub, fallback: pub, width: 0, height: 0 };
      continue;
    }
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue;
    const img = sharp(abs).rotate();
    const meta = await img.metadata();
    const width = Math.min(meta.width || MAX_W, MAX_W);
    const resized = img.resize({ width, withoutEnlargement: true });
    const webpBuf = await resized.clone().webp({ quality: 78 }).toBuffer();
    const fbBuf = ext === '.png'
      ? await resized.clone().png({ compressionLevel: 9 }).toBuffer()
      : await resized.clone().jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    const outMeta = await sharp(webpBuf).metadata();
    const base = name.replace(/\.[^.]+$/, '');
    manifest[key] = {
      webp: await hashFn(webpBuf, `${base}.webp`),
      fallback: await hashFn(fbBuf, name),
      width: outMeta.width, height: outMeta.height,
    };
  }
  return manifest;
}

// Replace <img src="assets/..."> with a <picture> using the manifest.
export function rewriteImages(html, manifest) {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = (tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (!src || !manifest[src]) return tag;
    const { webp, fallback, width, height } = manifest[src];
    const alt = (tag.match(/\balt\s*=\s*["']([^"']*)["']/i) || [, ''])[1];
    const dims = width ? ` width="${width}" height="${height}"` : '';
    if (webp === fallback) { // svg
      return `<img src="${fallback}" alt="${alt}" loading="lazy" decoding="async">`;
    }
    return `<picture><source srcset="${webp}" type="image/webp">` +
      `<img src="${fallback}" alt="${alt}"${dims} loading="lazy" decoding="async"></picture>`;
  });
}
