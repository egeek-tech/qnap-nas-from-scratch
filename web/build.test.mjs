import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from './lib/slugify.mjs';
import MarkdownIt from 'markdown-it';
import calloutsPlugin from './lib/callouts.mjs';

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
