import type { ViewPresetId } from '../schemas/course';

export type ViewPreset = ViewPresetId;
export type QualityMode = 'high' | 'standard' | 'low';
export type RenderMode = '3d' | 'diagram';

export interface SceneSettings {
  viewPreset: ViewPreset;
  quality: QualityMode;
  renderMode: RenderMode;
  mirrored: boolean;
  modelVisible: boolean;
  modelOpacity: number;
  completedRopeVisible: boolean;
  riskOverlayVisible: boolean;
  contactOverlayVisible: boolean;
  teachingCuesVisible: boolean;
  errorOverlayVisible: boolean;
  cameraLocked: boolean;
  autoFollow: boolean;
}
