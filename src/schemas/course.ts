import { z } from 'zod';

const vector3Schema = z.tuple([z.number(), z.number(), z.number()]);

export const cameraPresetSchema = z.object({
  id: z.string().min(1),
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

export const courseStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  objective: z.string().min(1),
  instruction: z.string().min(1),
  tensionGuidance: z.string().min(1),
  verification: z.string().min(1),
  commonErrors: z.array(z.string().min(1)),
  releaseInstruction: z.string().min(1),
  recommendedView: z.string().min(1),
  focusPoint: vector3Schema,
  ropeSegments: z.array(ropeSegmentSchema),
  safetyChecks: z.array(safetyCheckSchema),
});

export const poseSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  bodyOrientation: z.string().min(1),
  supportState: z.string().min(1),
  jointNotes: z.record(z.string(), z.string()),
  prohibitedDrift: z.array(z.string()),
  recommendedViews: z.array(z.string()),
  riskRegions: z.array(z.string()),
  sourceStatus: z.enum(['draft', 'reviewed', 'approved']),
  version: z.string().min(1),
});

export const courseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  aliases: z.array(z.string()),
  summary: z.string().min(1),
  difficulty: z.enum(['intro', 'beginner', 'intermediate', 'advanced']),
  riskLevel: z.enum(['low', 'moderate', 'high', 'critical']),
  prerequisites: z.array(z.string()),
  equipment: z.array(z.string()),
  modelId: z.string().min(1),
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
