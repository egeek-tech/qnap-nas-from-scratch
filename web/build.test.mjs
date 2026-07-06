import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from './lib/slugify.mjs';

test('slugify matches GitHub anchors', () => {
  assert.equal(slugify('UART fix'), 'uart-fix');
  assert.equal(slugify('Encryption (/)'), 'encryption-');
  assert.equal(slugify('S.M.A.R.T.'), 'smart');
  assert.equal(slugify('TPM \\& TANG'), 'tpm--tang');
  assert.equal(slugify('NVMe cache'), 'nvme-cache');
});
