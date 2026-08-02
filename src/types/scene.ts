export type ViewPreset = 'front' | 'back' | 'left' | 'right' | 'top' | 'detail';
export type QualityMode = 'high' | 'standard' | 'low';

export interface SceneSettings {
  viewPreset: ViewPreset;
  quality: QualityMode;
  mirrored: boolean;
  modelVisible: boolean;
  modelOpacity: number;
  completedRopeVisible: boolean;
  riskOverlayVisible: boolean;
  cameraLocked: boolean;
}
