import manifest from './model-assets.json';
import { modelAssetSchema } from '../schemas/course';
import type { ModelAsset } from '../schemas/course';

export type ModelQualityTier = 'placeholder' | 'mobile' | 'full' | 'qa';

export interface ModelCatalogOption {
  asset: ModelAsset;
  previewUrl?: string;
  badge: string;
  description: string;
  qualityTier: ModelQualityTier;
  recommended: boolean;
  warning?: string;
  sizeBytes?: number;
}

interface CatalogMetadata {
  previewPath?: string;
  badge: string;
  description: string;
  qualityTier: Exclude<ModelQualityTier, 'placeholder'>;
  recommended: boolean;
  warning?: string;
  sizeBytes: number;
}

interface ManifestEntry {
  id: string;
  path: string;
  catalog: CatalogMetadata;
  [key: string]: unknown;
}

const entries = manifest as unknown as ManifestEntry[];

function toCatalogOption(entry: ManifestEntry): ModelCatalogOption {
  const asset = modelAssetSchema.parse({
    ...entry,
    url: `${import.meta.env.BASE_URL}${entry.path}`,
  });
  const previewUrl = entry.catalog.previewPath
    ? `${import.meta.env.BASE_URL}${entry.catalog.previewPath}`
    : undefined;

  return {
    asset,
    ...(previewUrl ? { previewUrl } : {}),
    badge: entry.catalog.badge,
    description: entry.catalog.description,
    qualityTier: entry.catalog.qualityTier,
    recommended: entry.catalog.recommended,
    ...(entry.catalog.warning ? { warning: entry.catalog.warning } : {}),
    sizeBytes: entry.catalog.sizeBytes,
  };
}

export const modelAssetCandidates: ModelCatalogOption[] = entries.map(toCatalogOption);

const qaOption = modelAssetCandidates.find((option) => option.asset.id === 'khronos-rigged-figure-qa-v1');
if (!qaOption) throw new Error('RiggedFigure QA manifest entry is missing');

export const riggedFigureQaAsset = qaOption.asset;
