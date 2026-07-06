import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

// Variable woff2 shipped by @fontsource-variable packages (latin, weight axis).
const FONTS = [
  {
    family: 'Oswald',
    pkg: '@fontsource-variable/oswald/files/oswald-latin-wght-normal.woff2',
    file: 'oswald.woff2',
    weight: '200 700',
  },
  {
    family: 'Source Serif 4',
    pkg: '@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2',
    file: 'source-serif-4.woff2',
    weight: '200 900',
  },
  {
    family: 'JetBrains Mono',
    pkg: '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
    file: 'jetbrains-mono.woff2',
    weight: '100 800',
  },
];

// Copy woff2 files into outDir/fonts and return the @font-face CSS.
export async function copyFonts(outDir) {
  const dir = path.join(outDir, 'fonts');
  await mkdir(dir, { recursive: true });
  let css = '';
  for (const f of FONTS) {
    await copyFile(require.resolve(f.pkg), path.join(dir, f.file));
    css +=
      `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};` +
      `font-display:swap;src:url('fonts/${f.file}') format('woff2');}\n`;
  }
  return css;
}
