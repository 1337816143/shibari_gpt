import { useCallback, useEffect, useMemo, useState } from 'react';

const SPEEDS = [0.25, 0.5, 1, 1.5] as const;

export function usePlayback(stepCount: number) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [loopStep, setLoopStep] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);

  const clampIndex = useCallback(
    (index: number) => Math.max(0, Math.min(stepCount - 1, index)),
    [stepCount],
  );

  const goToStep = useCallback(
    (index: number) => {
      setStepIndex(clampIndex(index));
      setProgress(0);
    },
    [clampIndex],
  );

  const previous = useCallback(() => goToStep(stepIndex - 1), [goToStep, stepIndex]);
  const next = useCallback(() => goToStep(stepIndex + 1), [goToStep, stepIndex]);
  const replay = useCallback(() => {
    setProgress(0);
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let start = performance.now();
    const duration = 3000 / speed;

    const tick = (now: number) => {
      const nextProgress = Math.min(1, (now - start) / duration);
      setProgress(nextProgress);
      if (nextProgress < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      if (loopStep) {
        start = now;
        setProgress(0);
        frame = requestAnimationFrame(tick);
        return;
      }
      if (stepIndex < stepCount - 1) {
        setStepIndex((current) => current + 1);
        start = now;
        setProgress(0);
        frame = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [loopStep, playing, speed, stepCount, stepIndex]);

  return useMemo(
    () => ({
      stepIndex,
      progress,
      playing,
      loopStep,
      speed,
      speeds: SPEEDS,
      setProgress,
      setPlaying,
      setLoopStep,
      setSpeed,
      goToStep,
      previous,
      next,
      replay,
    }),
    [goToStep, loopStep, next, playing, previous, progress, replay, speed, stepIndex],
  );
}
