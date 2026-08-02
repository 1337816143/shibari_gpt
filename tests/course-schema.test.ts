import { describe, expect, it } from 'vitest';
import { demoCourse } from '../src/data/demoCourse';
import { courseSchema } from '../src/schemas/course';

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
});
