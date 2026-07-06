import { readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import { slugify } from './lib/slugify.mjs';
import calloutsPlugin from './lib/callouts.mjs';
import { extractHero } from './lib/hero.mjs';
import { collectHeadings, renderSidebar, renderRail } from './lib/toc.mjs';
import { optimizeAssets, rewriteImages } from './lib/images.mjs';
import { createHighlighterPlugin } from './lib/highlight.mjs';
import { copyFonts } from './lib/fonts.mjs';
import { writeHashed } from './lib/assets.mjs';
import { buildSearchIndex, sectionsFromHtml } from './lib/search.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const REPO_URL = 'https://github.com/egeek-tech/qnap-nas-from-scratch';
const REV = new Date().toISOString().slice(0, 7).replace('-', '.');
const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function build({ root = ROOT } = {}) {
  const outDir = path.join(root, 'dist');
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  const { title, lede, body } = extractHero(readme);

  const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
    .use(anchor, { slugify, permalink: false })
    .use(calloutsPlugin)
    .use(await createHighlighterPlugin());

  const env = {};
  const tokens = md.parse(body, env);
  const headings = collectHeadings(tokens);
  let content = md.renderer.render(tokens, md.options, env);

  const manifest = await optimizeAssets(path.join(root, 'assets'), outDir, (buf, name) =>
    writeHashed(outDir, name, buf),
  );
  content = rewriteImages(content, manifest);

  const fontCss = await copyFonts(outDir);
  const themeCss = await readFile(path.join(root, 'web/theme.css'), 'utf8');
  const cssHref = await writeHashed(outDir, 'theme.css', fontCss + themeCss);
  const jsHref = await writeHashed(outDir, 'app.js', await readFile(path.join(root, 'web/app.js')));
  const nasSvg = await readFile(path.join(root, 'web/nas.svg'), 'utf8');

  const index = buildSearchIndex(headings, sectionsFromHtml(content));
  const heroTitle = esc(title.split(/\s+[-–]\s+/)[0]); // punchy hero, e.g. "Qnap TS-h973AX"

  const tmpl = await readFile(path.join(root, 'web/template.html'), 'utf8');
  const html = tmpl
    .replaceAll('{{THEME}}', 'light')
    .replaceAll('{{TITLE}}', esc(title))
    .replaceAll('{{LEDE}}', esc(lede))
    .replaceAll('{{HERO_TITLE}}', heroTitle)
    .replaceAll('{{CSS_HREF}}', cssHref)
    .replaceAll('{{JS_HREF}}', jsHref)
    .replaceAll('{{REPO_URL}}', REPO_URL)
    .replaceAll('{{NAS_SVG}}', nasSvg)
    .replaceAll('{{SIDEBAR}}', renderSidebar(headings))
    .replaceAll('{{RAIL}}', renderRail(headings))
    .replaceAll('{{CONTENT}}', content)
    .replaceAll(
      '{{SECTION_COUNT}}',
      String(headings.filter((h) => h.level === 1).length).padStart(2, '0'),
    )
    .replaceAll('{{REV}}', REV)
    .replaceAll('{{SEARCH_INDEX}}', JSON.stringify(index).replace(/</g, '\\u003c'));

  await writeFile(path.join(outDir, 'index.html'), html);
  return { outDir, headings, index };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  build()
    .then((r) =>
      console.log(`built dist/ — ${r.headings.length} headings, ${r.index.length} search entries`),
    )
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
