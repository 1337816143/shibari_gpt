import { describe, expect, it } from 'vitest';
import { demoCourse } from '../src/data/demoCourse';
import { riggedFigureQaAsset } from '../src/data/modelAssets';
import { courseSchema, modelAssetSchema, modelTransformSchema } from '../src/schemas/course';

describe('course schema', () => {
  it('accepts the demo course and materializes review records', () => {
    expect(courseSchema.safeParse(demoCourse).success).toBe(true);
    expect(demoCourse.reviewRecords).toEqual([]);
  });

  it('keeps contextual checks and visual teaching metadata attached to every step', () => {
    expect(demoCourse.steps.every((step) => step.safetyChecks.length > 0)).toBe(true);
    expect(demoCourse.steps.every((step) => step.completionChecklist.length > 0)).toBe(true);
    expect(demoCourse.steps.every((step) => step.contactPoints.length > 0)).toBe(true);
    expect(demoCourse.steps.every((step) => step.errorStates.length > 0)).toBe(true);
  });

  it('does not publish prototype content or placeholder assets as approved', () => {
    expect(demoCourse.reviewStatus).toBe('prototype-only');
    expect(demoCourse.modelAsset.status).toBe('placeholder');
  });

  it('accepts a fully attributed local GLB candidate with load budgets', () => {
    expect(modelAssetSchema.safeParse(riggedFigureQaAsset).success).toBe(true);
    expect(riggedFigureQaAsset.kind).toBe('glb');
    if (riggedFigureQaAsset.kind !== 'glb') throw new Error('QA asset must be GLB');

    expect(riggedFigureQaAsset.status).toBe('technical-review');
    expect(riggedFigureQaAsset.allowRemote).toBe(false);
    expect(riggedFigureQaAsset.maxBytes).toBeLessThanOrEqual(8 * 1024 * 1024);
    expect(riggedFigureQaAsset.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects GLB entries without source, license and transform metadata', () => {
    expect(modelAssetSchema.safeParse({
      id: 'incomplete-glb',
      kind: 'glb',
      license: 'unknown',
      attribution: 'unknown',
      status: 'technical-review',
    }).success).toBe(false);
  });

  it('rejects zero-scale transforms and excessive model budgets', () => {
    expect(modelTransformSchema.safeParse({
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 0, 1],
    }).success).toBe(false);

    expect(modelAssetSchema.safeParse({
      id: 'oversized-glb',
      displayName: 'Oversized QA model',
      kind: 'glb',
      url: '/oversized.glb',
      sourceUrl: 'https://example.com/source',
      licenseUrl: 'https://example.com/license',
      license: 'Test license',
      attribution: 'Test attribution',
      status: 'technical-review',
      adultPresentation: true,
      presentation: 'neutral-fully-clothed',
      allowRemote: false,
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      timeoutMs: 15000,
      maxBytes: 80 * 1024 * 1024,
    }).success).toBe(false);
  });

  it('rejects a course whose model id and asset id diverge', () => {
    expect(courseSchema.safeParse({ ...demoCourse, modelId: 'different-model' }).success).toBe(false);
  });

  it('rejects approval labels without version-bound independent reviews', () => {
    expect(courseSchema.safeParse({ ...demoCourse, reviewStatus: 'approved' }).success).toBe(false);
  });

  it('accepts approval only after model, pose and three required reviews are approved', () => {
    const reviewedAt = '2026-08-02T16:00:00.000Z';
    const approved = {
      ...demoCourse,
      reviewStatus: 'approved' as const,
      modelAsset: { ...demoCourse.modelAsset, status: 'approved' as const },
      pose: { ...demoCourse.pose, sourceStatus: 'approved' as const },
      reviewers: ['Independent rope reviewer', 'Independent medical reviewer', 'Independent model reviewer'],
      reviewRecords: [
        {
          id: 'rope-v1',
          role: 'rope-technique' as const,
          reviewer: 'Independent rope reviewer',
          status: 'approved' as const,
          scope: ['pose', 'rope path', 'release sequence'],
          reviewedVersion: demoCourse.courseVersion,
          reviewedAt,
          notes: 'Version-bound rope review completed.',
        },
        {
          id: 'medical-v1',
          role: 'medical-anatomy' as const,
          reviewer: 'Independent medical reviewer',
          status: 'approved' as const,
          scope: ['contact points', 'stop conditions', 'risk wording'],
          reviewedVersion: demoCourse.courseVersion,
          reviewedAt,
          notes: 'Version-bound medical review completed.',
        },
        {
          id: 'model-v1',
          role: 'model-technical' as const,
          reviewer: 'Independent model reviewer',
          status: 'approved' as const,
          scope: ['license', 'skeleton', 'weights', 'performance'],
          reviewedVersion: demoCourse.modelVersion,
          reviewedAt,
          notes: 'Version-bound model review completed.',
        },
      ],
    };

    expect(courseSchema.safeParse(approved).success).toBe(true);
  });
});
