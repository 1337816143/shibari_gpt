import { z } from 'zod';

export const viewPresetSchema = z.enum(['front', 'back', 'left', 'right', 'top', 'detail']);
const vector3Schema = z.tuple([z.number(), z.number(), z.number()]);

export const cameraPresetSchema = z.object({
  id: viewPresetSchema,
  label: z.string().min(1),
  position: vector3Schema,
  target: vector3Schema,
});

export const ropeSegmentSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['completed', 'current', 'tail']),
  points: z.array(vector3Schema).min(2),
  radius: z.number().positive(),
});

export const safetyCheckSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  severity: z.enum(['info', 'warning', 'stop']),
  bodyRegion: z.string().min(1),
  instruction: z.string().min(1),
});

export const contactPointSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(['contact', 'check', 'risk']),
  position: vector3Schema,
  note: z.string().min(1),
});

export const handCueSchema = z.object({
  hand: z.enum(['left', 'right', 'both']),
  label: z.string().min(1),
  position: vector3Schema,
  target: vector3Schema,
});

export const directionCueSchema = z.object({
  label: z.string().min(1),
  from: vector3Schema,
  to: vector3Schema,
});

export const errorStateSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  risk: z.string().min(1),
  ropeSegments: z.array(ropeSegmentSchema).min(1),
});

export const courseStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  objective: z.string().min(1),
  instruction: z.string().min(1),
  tensionGuidance: z.string().min(1),
  verification: z.string().min(1),
  commonErrors: z.array(z.string().min(1)),
  releaseInstruction: z.string().min(1),
  recommendedView: viewPresetSchema,
  focusPoint: vector3Schema,
  ropeSegments: z.array(ropeSegmentSchema),
  safetyChecks: z.array(safetyCheckSchema).min(1),
  completionChecklist: z.array(z.string().min(1)).min(1),
  contactPoints: z.array(contactPointSchema),
  handCue: handCueSchema.optional(),
  directionCue: directionCueSchema.optional(),
  errorStates: z.array(errorStateSchema),
});

export const poseSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  bodyOrientation: z.string().min(1),
  supportState: z.string().min(1),
  jointNotes: z.record(z.string(), z.string()),
  prohibitedDrift: z.array(z.string()),
  recommendedViews: z.array(viewPresetSchema),
  riskRegions: z.array(z.string()),
  sourceStatus: z.enum(['draft', 'reviewed', 'approved']),
  version: z.string().min(1),
});

const modelAssetBaseSchema = z.object({
  id: z.string().min(1),
  license: z.string().min(1),
  attribution: z.string().min(1),
  status: z.enum(['placeholder', 'technical-review', 'approved']),
});

export const modelTransformSchema = z.object({
  position: vector3Schema,
  rotation: vector3Schema,
  scale: vector3Schema.refine((value) => value.every((axis) => axis !== 0), {
    message: 'Model scale axes cannot be zero',
  }),
});

const proceduralModelAssetSchema = modelAssetBaseSchema.extend({
  kind: z.literal('procedural'),
});

const glbModelAssetSchema = modelAssetBaseSchema.extend({
  kind: z.literal('glb'),
  url: z.string().min(1),
  sourceUrl: z.string().url(),
  licenseUrl: z.string().url(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
  allowRemote: z.boolean(),
  transform: modelTransformSchema,
  animationClip: z.string().min(1).optional(),
});

export const modelAssetSchema = z.discriminatedUnion('kind', [
  proceduralModelAssetSchema,
  glbModelAssetSchema,
]);

export const courseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  aliases: z.array(z.string()),
  summary: z.string().min(1),
  category: z.enum(['safety', 'rope-handling', 'foundations', 'body-path']),
  tags: z.array(z.string().min(1)),
  estimatedMinutes: z.number().int().positive(),
  learningObjectives: z.array(z.string().min(1)).min(1),
  difficulty: z.enum(['intro', 'beginner', 'intermediate', 'advanced']),
  riskLevel: z.enum(['low', 'moderate', 'high', 'critical']),
  prerequisites: z.array(z.string()),
  equipment: z.array(z.string()),
  modelId: z.string().min(1),
  modelAsset: modelAssetSchema,
  pose: poseSchema,
  cameraPresets: z.array(cameraPresetSchema).min(1),
  steps: z.array(courseStepSchema).min(1),
  references: z.array(z.object({ title: z.string(), url: z.string().url(), type: z.string() })),
  reviewers: z.array(z.string()),
  reviewStatus: z.enum(['prototype-only', 'technical-review', 'safety-review', 'approved']),
  modelVersion: z.string().min(1),
  courseVersion: z.string().min(1),
  updatedAt: z.string().datetime(),
});

export type Course = z.infer<typeof courseSchema>;
export type CourseStep = z.infer<typeof courseStepSchema>;
export type ModelAsset = z.infer<typeof modelAssetSchema>;
export type ViewPresetId = z.infer<typeof viewPresetSchema>;
