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
  displayName: z.string().min(1).default('Unnamed model asset'),
  license: z.string().min(1),
  attribution: z.string().min(1),
  status: z.enum(['placeholder', 'technical-review', 'approved']),
  adultPresentation: z.literal(true).default(true),
  presentation: z.literal('neutral-fully-clothed').default('neutral-fully-clothed'),
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
  timeoutMs: z.number().int().min(3000).max(60000).default(15000),
  maxBytes: z.number().int().min(1024).max(50 * 1024 * 1024).default(12 * 1024 * 1024),
});

export const modelAssetSchema = z.discriminatedUnion('kind', [
  proceduralModelAssetSchema,
  glbModelAssetSchema,
]);

export const reviewRecordSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['rope-technique', 'medical-anatomy', 'model-technical', 'accessibility', 'editorial']),
  reviewer: z.string().min(1),
  status: z.enum(['requested', 'in-review', 'changes-required', 'approved', 'rejected']),
  scope: z.array(z.string().min(1)).min(1),
  reviewedVersion: z.string().min(1),
  reviewedAt: z.string().datetime().optional(),
  notes: z.string().min(1),
  evidenceUrl: z.string().url().optional(),
});

const courseObjectSchema = z.object({
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
  reviewRecords: z.array(reviewRecordSchema).default([]),
  reviewStatus: z.enum(['prototype-only', 'technical-review', 'safety-review', 'approved']),
  modelVersion: z.string().min(1),
  courseVersion: z.string().min(1),
  updatedAt: z.string().datetime(),
});

export const courseSchema = courseObjectSchema.superRefine((course, context) => {
  if (course.modelId !== course.modelAsset.id) {
    context.addIssue({
      code: 'custom',
      path: ['modelId'],
      message: 'modelId must match modelAsset.id',
    });
  }

  if (course.reviewStatus !== 'approved') return;

  if (course.modelAsset.status !== 'approved') {
    context.addIssue({
      code: 'custom',
      path: ['modelAsset', 'status'],
      message: 'An approved course requires an approved model asset',
    });
  }
  if (course.pose.sourceStatus !== 'approved') {
    context.addIssue({
      code: 'custom',
      path: ['pose', 'sourceStatus'],
      message: 'An approved course requires an approved pose',
    });
  }
  if (course.reviewers.length === 0) {
    context.addIssue({
      code: 'custom',
      path: ['reviewers'],
      message: 'An approved course must name independent reviewers',
    });
  }

  const requiredReviews = [
    { role: 'rope-technique', version: course.courseVersion },
    { role: 'medical-anatomy', version: course.courseVersion },
    { role: 'model-technical', version: course.modelVersion },
  ] as const;

  for (const requirement of requiredReviews) {
    const accepted = course.reviewRecords.some(
      (record) => record.role === requirement.role &&
        record.status === 'approved' &&
        record.reviewedVersion === requirement.version &&
        Boolean(record.reviewedAt),
    );
    if (!accepted) {
      context.addIssue({
        code: 'custom',
        path: ['reviewRecords'],
        message: `Missing approved ${requirement.role} review for version ${requirement.version}`,
      });
    }
  }
});

export type Course = z.infer<typeof courseSchema>;
export type CourseStep = z.infer<typeof courseStepSchema>;
export type ModelAsset = z.infer<typeof modelAssetSchema>;
export type ReviewRecord = z.infer<typeof reviewRecordSchema>;
export type ViewPresetId = z.infer<typeof viewPresetSchema>;
