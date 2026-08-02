import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { Course } from '../../schemas/course';
import type { ViewPreset } from '../../types/scene';

interface CameraRigProps {
  course: Course;
  preset: ViewPreset;
  locked: boolean;
  mirrored: boolean;
}

export function CameraRig({ course, preset, locked, mirrored }: CameraRigProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    const config = course.cameraPresets.find((item) => item.id === preset) ?? course.cameraPresets[0];
    if (!config) return;
    const [px, py, pz] = config.position;
    const [tx, ty, tz] = config.target;
    camera.position.set(mirrored ? -px : px, py, pz);
    controlsRef.current?.target.set(mirrored ? -tx : tx, ty, tz);
    camera.lookAt(new THREE.Vector3(mirrored ? -tx : tx, ty, tz));
    controlsRef.current?.update();
  }, [camera, course.cameraPresets, mirrored, preset]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={!locked}
      enableDamping
      dampingFactor={0.08}
      minDistance={1.4}
      maxDistance={7}
      minPolarAngle={0.12}
      maxPolarAngle={Math.PI - 0.12}
      target={[0, 1.35, 0]}
    />
  );
}
