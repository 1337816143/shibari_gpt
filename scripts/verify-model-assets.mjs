import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(root, 'public');
const manifestPath = join(root, 'src/data/model-assets.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

function inspectGlb(bytes, id) {
  if (bytes.length < 20) throw new Error(`${id}: GLB is too small.`);
  if (bytes.readUInt32LE(0) !== GLB_MAGIC) throw new Error(`${id}: invalid GLB magic.`);
  if (bytes.readUInt32LE(4) !== 2) throw new Error(`${id}: only glTF 2.0 GLB is supported.`);
  if (bytes.readUInt32LE(8) !== bytes.length) throw new Error(`${id}: declared GLB length is stale.`);

  const jsonLength = bytes.readUInt32LE(12);
  const jsonType = bytes.readUInt32LE(16);
  if (jsonType !== JSON_CHUNK) throw new Error(`${id}: first GLB chunk must be JSON.`);
  if (20 + jsonLength > bytes.length) throw new Error(`${id}: JSON chunk exceeds the file boundary.`);

  const jsonText = bytes.subarray(20, 20 + jsonLength).toString('utf8').replace(/[\u0000 ]+$/u, '');
  const gltf = JSON.parse(jsonText);
  if (gltf?.asset?.version !== '2.0') throw new Error(`${id}: embedded glTF asset version is not 2.0.`);
  if (!Array.isArray(gltf.scenes) || gltf.scenes.length === 0) throw new Error(`${id}: GLB has no scene.`);
  if (!Array.isArray(gltf.nodes) || gltf.nodes.length === 0) throw new Error(`${id}: GLB has no nodes.`);

  return {
    nodes: gltf.nodes.length,
    meshes: Array.isArray(gltf.meshes) ? gltf.meshes.length : 0,
    skins: Array.isArray(gltf.skins) ? gltf.skins.length : 0,
    animations: Array.isArray(gltf.animations) ? gltf.animations.length : 0,
  };
}

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
  if (typeof entry.path !== 'string' || !entry.path || entry.path.startsWith('/') || entry.path.includes('..')) {
    throw new Error(`${entry.id}: invalid local asset path.`);
  }
  if (!/^[a-f0-9]{64}$/i.test(entry.sha256 ?? '')) {
    throw new Error(`${entry.id}: invalid SHA-256 declaration.`);
  }
  if (!Number.isInteger(entry.maxBytes) || entry.maxBytes <= 0) {
    throw new Error(`${entry.id}: invalid byte budget.`);
  }

  const assetPath = normalize(join(publicRoot, entry.path));
  if (!assetPath.startsWith(`${publicRoot}/`)) throw new Error(`${entry.id}: asset path escapes public/.`);
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
  const glb = inspectGlb(bytes, entry.id);

  const [source, license, checksum] = await Promise.all([
    readFile(join(metadataDir, 'SOURCE.md'), 'utf8'),
    readFile(join(metadataDir, 'LICENSE.txt'), 'utf8'),
    readFile(join(metadataDir, 'SHA256.txt'), 'utf8'),
  ]);
  if (!source.trim()) throw new Error(`${entry.id}: SOURCE.md is empty.`);
  if (!license.trim()) throw new Error(`${entry.id}: LICENSE.txt is empty.`);
  if (!checksum.includes(actualHash)) throw new Error(`${entry.id}: SHA256.txt is stale.`);

  console.log(
    `verified ${entry.id}: ${fileInfo.size} bytes, sha256 ${actualHash}, ` +
    `${glb.nodes} nodes, ${glb.meshes} meshes, ${glb.skins} skins, ${glb.animations} animations`,
  );
}
