import manifest from './model-assets.json';
import { modelAssetSchema } from '../schemas/course';

const qaEntry = manifest.find((entry) => entry.id === 'khronos-rigged-figure-qa-v1');
if (!qaEntry) throw new Error('RiggedFigure QA manifest entry is missing');

export const riggedFigureQaAsset = modelAssetSchema.parse({
  ...qaEntry,
  url: `${import.meta.env.BASE_URL}${qaEntry.path}`,
});

export const modelAssetCandidates = [riggedFigureQaAsset] as const;
