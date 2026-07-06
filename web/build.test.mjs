import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from './lib/slugify.mjs';
import MarkdownIt from 'markdown-it';
import calloutsPlugin from './lib/callouts.mjs';
import { extractHero } from './lib/hero.mjs';

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
