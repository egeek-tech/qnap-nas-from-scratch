import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

export function hashName(buf, name) {
  const h = createHash('sha256').update(buf).digest('hex').slice(0, 8);
  const ext = path.extname(name);
  const base = ext ? name.slice(0, -ext.length) : name;
  return `${base}.${h}${ext}`;
}

// Write contents into outDir under a hashed name; return the public path "/<hashed>".
export async function writeHashed(outDir, name, contents) {
  const buf = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  const hashed = hashName(buf, name);
  await writeFile(path.join(outDir, hashed), buf);
  return `/${hashed}`;
}
