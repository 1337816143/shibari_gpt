import { modelAssetSchema } from '../schemas/course';

export const qaModelAsset = modelAssetSchema.parse({
  id: 'khronos-rigged-figure-qa-v1',
  displayName: 'Khronos RiggedFigure · 技术 QA',
  kind: 'glb',
  url: `${import.meta.env.BASE_URL}models/rigged-figure-qa/RiggedFigure.glb`,
  sourceUrl: 'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/RiggedFigure',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  license: 'CC BY 4.0',
  attribution: '© 2017 Cesium; distributed by Khronos glTF Sample Assets',
  status: 'technical-review',
  adultPresentation: true,
  presentation: 'neutral-fully-clothed',
  allowRemote: false,
  transform: {
    position: [0, -0.55, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  },
  timeoutMs: 12000,
  maxBytes: 8 * 1024 * 1024,
});
