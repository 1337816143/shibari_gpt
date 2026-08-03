import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import process from 'node:process';

const DIST_DIRECTORY = path.resolve('dist');
const MANIFEST_PATH = path.join(DIST_DIRECTORY, '.vite', 'manifest.json');
const KIB = 1024;

const budgets = {
  initialGzip: 160 * KIB,
  threeDimensionalIncrementalGzip: 340 * KIB,
  allJavaScriptGzip: 450 * KIB,
  allCssGzip: 12 * KIB,
};

const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
const manifestEntries = Object.entries(manifest);

const fileGzipSize = async (relativePath) => {
  const file = await readFile(path.join(DIST_DIRECTORY, relativePath));
  return gzipSync(file, { level: 9 }).byteLength;
};

const collectStaticGraph = (rootKeys) => {
  const visitedKeys = new Set();
  const files = new Set();

  const visit = (key) => {
    if (visitedKeys.has(key)) return;
    visitedKeys.add(key);

    const chunk = manifest[key];
    if (!chunk) throw new Error(`Manifest references a missing chunk: ${key}`);

    if (chunk.file) files.add(chunk.file);
    for (const cssFile of chunk.css ?? []) files.add(cssFile);
    for (const assetFile of chunk.assets ?? []) files.add(assetFile);
    for (const importedKey of chunk.imports ?? []) visit(importedKey);
  };

  for (const rootKey of rootKeys) visit(rootKey);
  return files;
};

const gzipTotal = async (files, predicate = () => true) => {
  let total = 0;
  for (const file of files) {
    if (predicate(file)) total += await fileGzipSize(file);
  }
  return total;
};

const entryKeys = manifestEntries
  .filter(([, chunk]) => chunk.isEntry)
  .map(([key]) => key);

if (entryKeys.length === 0) throw new Error('No Vite entry chunk found in the build manifest.');

const studioEntry = manifestEntries.find(([key, chunk]) =>
  key.includes('StudioScene') || chunk.src?.includes('StudioScene'),
);

if (!studioEntry) throw new Error('The lazy StudioScene entry is missing from the build manifest.');

const initialFiles = collectStaticGraph(entryKeys);
const threeDimensionalFiles = collectStaticGraph([studioEntry[0]]);
const incrementalThreeDimensionalFiles = new Set(
  [...threeDimensionalFiles].filter((file) => !initialFiles.has(file)),
);

const allFiles = new Set();
for (const [, chunk] of manifestEntries) {
  if (chunk.file) allFiles.add(chunk.file);
  for (const cssFile of chunk.css ?? []) allFiles.add(cssFile);
  for (const assetFile of chunk.assets ?? []) allFiles.add(assetFile);
}

const initialGzip = await gzipTotal(initialFiles, (file) => /\.(?:js|css)$/.test(file));
const threeDimensionalIncrementalGzip = await gzipTotal(
  incrementalThreeDimensionalFiles,
  (file) => /\.(?:js|css)$/.test(file),
);
const allJavaScriptGzip = await gzipTotal(allFiles, (file) => file.endsWith('.js'));
const allCssGzip = await gzipTotal(allFiles, (file) => file.endsWith('.css'));

const formatKib = (bytes) => `${(bytes / KIB).toFixed(1)} KiB gzip`;
const checks = [
  ['Initial application', initialGzip, budgets.initialGzip],
  ['Incremental 3D scene', threeDimensionalIncrementalGzip, budgets.threeDimensionalIncrementalGzip],
  ['All JavaScript', allJavaScriptGzip, budgets.allJavaScriptGzip],
  ['All CSS', allCssGzip, budgets.allCssGzip],
];

let failed = false;
for (const [label, actual, budget] of checks) {
  const status = actual <= budget ? 'PASS' : 'FAIL';
  console.log(`${status.padEnd(4)} ${label.padEnd(24)} ${formatKib(actual)} / ${formatKib(budget)}`);
  if (actual > budget) failed = true;
}

const studioFile = studioEntry[1].file;
const studioStat = await stat(path.join(DIST_DIRECTORY, studioFile));
console.log(`INFO Studio entry             ${(studioStat.size / KIB).toFixed(1)} KiB raw (${studioFile})`);

if (failed) {
  console.error('Bundle budget exceeded. Keep the 3D engine lazy and optimize dependencies before increasing a limit.');
  process.exit(1);
}
