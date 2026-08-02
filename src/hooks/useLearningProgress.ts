import { useCallback, useEffect, useMemo, useState } from 'react';

interface LearningProgressState {
  favorite: boolean;
  completedStepIds: string[];
  lastStepIndex: number;
}

const defaultState: LearningProgressState = {
  favorite: false,
  completedStepIds: [],
  lastStepIndex: 0,
};

function readState(storageKey: string): LearningProgressState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<LearningProgressState>;
    return {
      favorite: Boolean(parsed.favorite),
      completedStepIds: Array.isArray(parsed.completedStepIds)
        ? parsed.completedStepIds.filter((item): item is string => typeof item === 'string')
        : [],
      lastStepIndex: typeof parsed.lastStepIndex === 'number' && Number.isInteger(parsed.lastStepIndex)
        ? Math.max(0, parsed.lastStepIndex)
        : 0,
    };
  } catch {
    return defaultState;
  }
}

export function useLearningProgress(courseId: string) {
  const storageKey = `shibari-studio:learning:v1:${courseId}`;
  const [state, setState] = useState<LearningProgressState>(() => readState(storageKey));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Private browsing or storage quotas must not block the lesson player.
    }
  }, [state, storageKey]);

  const toggleFavorite = useCallback(() => {
    setState((current) => ({ ...current, favorite: !current.favorite }));
  }, []);

  const toggleStepComplete = useCallback((stepId: string) => {
    setState((current) => {
      const exists = current.completedStepIds.includes(stepId);
      return {
        ...current,
        completedStepIds: exists
          ? current.completedStepIds.filter((id) => id !== stepId)
          : [...current.completedStepIds, stepId],
      };
    });
  }, []);

  const markStepComplete = useCallback((stepId: string) => {
    setState((current) => current.completedStepIds.includes(stepId)
      ? current
      : { ...current, completedStepIds: [...current.completedStepIds, stepId] });
  }, []);

  const setLastStepIndex = useCallback((lastStepIndex: number) => {
    setState((current) => {
      const nextIndex = Math.max(0, lastStepIndex);
      return current.lastStepIndex === nextIndex ? current : { ...current, lastStepIndex: nextIndex };
    });
  }, []);

  const reset = useCallback(() => setState(defaultState), []);

  return useMemo(() => ({
    ...state,
    toggleFavorite,
    toggleStepComplete,
    markStepComplete,
    setLastStepIndex,
    reset,
  }), [markStepComplete, reset, setLastStepIndex, state, toggleFavorite, toggleStepComplete]);
}
