import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'src/data/model-assets.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

if (!Array.isArray(manifest) || manifest.length === 0) {
  throw new Error('Model asset manifest must contain at least one entry.');
}

const ids = new Set();
for (const entry of manifest) {
  if (!entry || typeof entry !== 'object') throw new Error('Manifest entries must be objects.');
  if (typeof entry.id !== 'string' || !entry.id) throw new Error('Every model asset needs an id.');
  if (ids.has(entry.id)) throw new Error(`Duplicate model asset id: ${entry.id}`);
  ids.add(entry.id);

  if (entry.kind !== 'glb') continue;
  if (entry.allowRemote !== false) throw new Error(`${entry.id}: committed assets must not be remote.`);
  if (typeof entry.path !== 'string' || entry.path.includes('..')) {
    throw new Error(`${entry.id}: invalid local asset path.`);
  }
  if (!/^[a-f0-9]{64}$/i.test(entry.sha256 ?? '')) {
    throw new Error(`${entry.id}: invalid SHA-256 declaration.`);
  }
  if (!Number.isInteger(entry.maxBytes) || entry.maxBytes <= 0) {
    throw new Error(`${entry.id}: invalid byte budget.`);
  }

  const assetPath = join(root, 'public', entry.path);
  const metadataDir = dirname(assetPath);
  const fileInfo = await stat(assetPath);
  if (!fileInfo.isFile()) throw new Error(`${entry.id}: asset is not a file.`);
  if (fileInfo.size > entry.maxBytes) {
    throw new Error(`${entry.id}: ${fileInfo.size} bytes exceeds ${entry.maxBytes}.`);
  }

  const bytes = await readFile(assetPath);
  const actualHash = createHash('sha256').update(bytes).digest('hex');
  if (actualHash !== entry.sha256.toLowerCase()) {
    throw new Error(`${entry.id}: SHA-256 mismatch (${actualHash}).`);
  }

  const [source, license, checksum] = await Promise.all([
    readFile(join(metadataDir, 'SOURCE.md'), 'utf8'),
    readFile(join(metadataDir, 'LICENSE.txt'), 'utf8'),
    readFile(join(metadataDir, 'SHA256.txt'), 'utf8'),
  ]);
  if (!source.trim()) throw new Error(`${entry.id}: SOURCE.md is empty.`);
  if (!license.trim()) throw new Error(`${entry.id}: LICENSE.txt is empty.`);
  if (!checksum.includes(actualHash)) throw new Error(`${entry.id}: SHA256.txt is stale.`);

  console.log(`verified ${entry.id}: ${fileInfo.size} bytes, sha256 ${actualHash}`);
}
