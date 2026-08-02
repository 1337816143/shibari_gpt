import { describe, expect, it } from 'vitest';
import { demoCourse } from '../src/data/demoCourse';
import { riggedFigureQaAsset } from '../src/data/modelAssets';
import { courseSchema, modelAssetSchema } from '../src/schemas/course';

describe('course schema', () => {
  it('accepts the demo course', () => {
    expect(courseSchema.safeParse(demoCourse).success).toBe(true);
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

  it('accepts a fully attributed GLB candidate for technical loader testing', () => {
    expect(modelAssetSchema.safeParse(riggedFigureQaAsset).success).toBe(true);
    expect(riggedFigureQaAsset.status).toBe('technical-review');
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
});
