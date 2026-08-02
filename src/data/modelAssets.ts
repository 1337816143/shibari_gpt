import { modelAssetSchema } from '../schemas/course';

export const riggedFigureQaAsset = modelAssetSchema.parse({
  id: 'khronos-rigged-figure-qa',
  kind: 'glb',
  url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/RiggedFigure/glTF-Binary/RiggedFigure.glb',
  sourceUrl: 'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/RiggedFigure',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  license: 'CC BY 4.0',
  attribution: '© 2017 Cesium; Khronos glTF Sample Assets',
  status: 'technical-review',
  allowRemote: true,
  transform: {
    position: [0, -0.55, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  },
});

export const modelAssetCandidates = [riggedFigureQaAsset] as const;
