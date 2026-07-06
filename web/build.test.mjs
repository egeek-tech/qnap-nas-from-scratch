import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from './lib/slugify.mjs';
import MarkdownIt from 'markdown-it';
import calloutsPlugin from './lib/callouts.mjs';
import { extractHero } from './lib/hero.mjs';
import anchor from 'markdown-it-anchor';
import { collectHeadings, renderSidebar, renderRail } from './lib/toc.mjs';
import { rewriteImages } from './lib/images.mjs';
import { hashName } from './lib/assets.mjs';

test('slugify matches GitHub anchors', () => {
  assert.equal(slugify('UART fix'), 'uart-fix');
  assert.equal(slugify('Encryption (/)'), 'encryption-');
  assert.equal(slugify('S.M.A.R.T.'), 'smart');
  assert.equal(slugify('TPM \\& TANG'), 'tpm--tang');
  assert.equal(slugify('NVMe cache'), 'nvme-cache');
});

test('callouts convert GFM alerts to admonitions', () => {
  const md = new MarkdownIt({ html: true }).use(calloutsPlugin);
  const html = md.render('> [!IMPORTANT]\n> Boot only from USB or NVMe.');
  assert.match(html, /<div class="adm adm-important">/);
  assert.match(html, /<span class="ic">!<\/span>/);
  assert.match(html, /<div class="h">Important<\/div>/);
  assert.match(html, /Boot only from USB or NVMe\./);
  assert.match(md.render('> just a quote'), /<blockquote>/); // normal quote untouched
});

test('callouts: marker-only first line does not leave an empty <p>', () => {
  const md = new MarkdownIt({ html: true }).use(calloutsPlugin);
  const html = md.render('> [!WARNING]\n>\n> Changing the block size will result in the loss of all data and partitions on the disk.');
  assert.match(html, /<div class="adm adm-warning">/);
  assert.match(html, /Changing the block size will result in the loss of all data and partitions on the disk\./);
  assert.doesNotMatch(html, /<p><\/p>/); // no stray empty paragraph
});

test('callouts: marker search is scoped to its own blockquote', () => {
  const md = new MarkdownIt({ html: true }).use(calloutsPlugin);
  const html = md.render('> ```\n> code\n> ```\n\n> [!NOTE]\n> real note');
  assert.match(html, /<blockquote>/);                 // the code-only quote stays a plain blockquote
  assert.match(html, /<div class="adm adm-note">/);    // the real NOTE converts
  assert.match(html, /real note/);
});

test('extractHero pulls title + lede and strips lead image and inline TOC', () => {
  const src = [
    '<img src="assets/hero.png" alt="drawing" width="800"/>',
    '',
    '# Qnap TS-h973AX - NAS server from scratch',
    '',
    '- [Qnap TS-h973AX](#qnap-ts-h973ax)',
    '  - [Board](#board)',
    '',
    '# Board',
    '',
    'The QNAP TS-h973AX is a 9-bay NAS.',
  ].join('\n');
  const { title, lede, body } = extractHero(src);
  assert.equal(title, 'Qnap TS-h973AX - NAS server from scratch');
  assert.match(lede, /9-bay NAS/);
  assert.doesNotMatch(body, /#qnap-ts-h973ax/);
  assert.doesNotMatch(body, /assets\/hero\.png/);
  assert.match(body, /^# Board/m);
});

test('extractHero reduces markdown in the lede to plain text', () => {
  const src = '# T\n\n- [x](#x)\n\n# S\n\nThe QNAP [TS-h973AX](https://q.example) is a `9-bay` **NAS** server.';
  const { lede } = extractHero(src);
  assert.equal(lede, 'The QNAP TS-h973AX is a 9-bay NAS server.');
});

test('collectHeadings + renderers', () => {
  const md = new MarkdownIt();
  const tokens = md.parse('# Board\n\n## Specification\n\n### Investigation\n\n# Linux', {});
  const h = collectHeadings(tokens);
  assert.deepEqual(h.map(x => [x.level, x.text, x.slug]), [
    [1, 'Board', 'board'],
    [2, 'Specification', 'specification'],
    [3, 'Investigation', 'investigation'],
    [1, 'Linux', 'linux'],
  ]);
  assert.match(renderSidebar(h), /href="#board"/);
  assert.match(renderRail(h), /On this page/);
});

test('collectHeadings slugs match markdown-it-anchor rendered ids (duplicates unique)', () => {
  const md = new MarkdownIt({ html: true }).use(anchor, { slugify });
  const src = '# LVM\n\n# LVM\n\n# BTRFS\n\n# LVM';
  const env = {};
  const tokens = md.parse(src, env);
  const slugs = collectHeadings(tokens).map(x => x.slug);
  const html = md.renderer.render(tokens, md.options, env);
  const ids = [...html.matchAll(/<h1[^>]*\bid="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(slugs, ids);                       // nav slugs === rendered ids
  assert.equal(new Set(slugs).size, slugs.length);    // all unique
});

test('rewriteImages emits <picture> with webp + fallback + lazy', () => {
  const manifest = { 'assets/qnap.jpg': { webp: '/assets/qnap.abc.webp', fallback: '/assets/qnap.abc.jpg', width: 1600, height: 900 } };
  const out = rewriteImages('<p><img src="assets/qnap.jpg" alt="drawing" width="800"/></p>', manifest);
  assert.match(out, /<picture>/);
  assert.match(out, /srcset="\/assets\/qnap\.abc\.webp" type="image\/webp"/);
  assert.match(out, /src="\/assets\/qnap\.abc\.jpg"/);
  assert.match(out, /loading="lazy"/);
  assert.match(out, /width="1600" height="900"/);
  assert.match(out, /alt="drawing"/);
});

test('hashName is stable and content-addressed', () => {
  const a = hashName(Buffer.from('hello'), 'app.js');
  assert.equal(a, hashName(Buffer.from('hello'), 'app.js'));
  assert.notEqual(a, hashName(Buffer.from('HELLO'), 'app.js'));
  assert.match(a, /^app\.[0-9a-f]{8}\.js$/);
});
