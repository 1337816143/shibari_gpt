import { describe, expect, it } from 'vitest';
import { demoCourse } from '../src/data/demoCourse';
import { riggedFigureQaAsset } from '../src/data/modelAssets';
import { courseSchema, modelAssetSchema } from '../src/schemas/course';

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
    expect(riggedFigureQaAsset.status).toBe('technical-review');
    expect(riggedFigureQaAsset.allowRemote).toBe(false);
    expect(riggedFigureQaAsset.maxBytes).toBeLessThanOrEqual(8 * 1024 * 1024);
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

  it('rejects zero-scale and excessive model budgets', () => {
    const invalid = {
      ...riggedFigureQaAsset,
      maxBytes: 80 * 1024 * 1024,
      transform: { ...riggedFigureQaAsset.transform, scale: [1, 0, 1] },
    };
    expect(modelAssetSchema.safeParse(invalid).success).toBe(false);
  });
});
