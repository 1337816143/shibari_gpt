import { Line } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { CourseStep } from '../../schemas/course';

interface RopePathProps {
  step: CourseStep;
  progress: number;
  showCompleted: boolean;
  mirrored: boolean;
}

const COLORS = {
  completed: '#8e755e',
  current: '#f0b85c',
  tail: '#ffdf9d',
} as const;

export function RopePath({ step, progress, showCompleted, mirrored }: RopePathProps) {
  const segments = useMemo(
    () =>
      step.ropeSegments
        .filter((segment) => showCompleted || segment.role !== 'completed')
        .map((segment) => {
          const source = segment.points.map(([x, y, z]) => new THREE.Vector3(mirrored ? -x : x, y, z));
          const curve = new THREE.CatmullRomCurve3(source, segment.role === 'tail' ? false : true, 'centripetal');
          const sampleCount = 96;
          const visibleProgress = segment.role === 'current' || segment.role === 'tail' ? progress : 1;
          const count = Math.max(2, Math.ceil(sampleCount * visibleProgress));
          return { ...segment, points: curve.getPoints(count) };
        }),
    [mirrored, progress, showCompleted, step.ropeSegments],
  );

  return (
    <group>
      {segments.map((segment) => (
        <Line
          key={segment.id}
          points={segment.points}
          color={COLORS[segment.role]}
          lineWidth={segment.role === 'current' ? 9 : 6}
          transparent
          opacity={segment.role === 'completed' ? 0.52 : 1}
        />
      ))}
    </group>
  );
}
