import { AdaptiveDpr, ContactShadows, Html, PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';
import type { CourseStep, Course } from '../../schemas/course';
import type { SceneSettings } from '../../types/scene';
import { CameraRig } from './CameraRig';
import { RiskZones } from './RiskZones';
import { RopePath } from './RopePath';
import { TrainingMannequin } from './TrainingMannequin';

interface StudioSceneProps {
  course: Course;
  step: CourseStep;
  progress: number;
  settings: SceneSettings;
  onQualityFallback: () => void;
}

export function StudioScene({ course, step, progress, settings, onQualityFallback }: StudioSceneProps) {
  const [dpr, setDpr] = useState(settings.quality === 'high' ? 2 : settings.quality === 'low' ? 1 : 1.5);

  return (
    <Canvas
      className="studio-canvas"
      shadows={settings.quality !== 'low'}
      dpr={dpr}
      camera={{ position: [0, 1.55, 4.3], fov: 38, near: 0.1, far: 100 }}
      gl={{ antialias: settings.quality !== 'low', powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#121819']} />
      <fog attach="fog" args={['#121819', 7, 13]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 7, 4]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-3, 3, -2]} intensity={0.8} />
      <Suspense fallback={<Html center><div className="scene-loader">加载 3D 场景…</div></Html>}>
        <group scale={settings.mirrored ? [-1, 1, 1] : [1, 1, 1]}>
          {settings.modelVisible && <TrainingMannequin opacity={settings.modelOpacity} />}
        </group>
        <RopePath
          step={step}
          progress={progress}
          showCompleted={settings.completedRopeVisible}
          mirrored={settings.mirrored}
        />
        <RiskZones visible={settings.riskOverlayVisible} mirrored={settings.mirrored} />
        <ContactShadows position={[0, -0.55, 0]} opacity={0.45} scale={5.5} blur={2.7} far={2.8} />
      </Suspense>
      <CameraRig course={course} preset={settings.viewPreset} locked={settings.cameraLocked} mirrored={settings.mirrored} />
      <AdaptiveDpr pixelated />
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          onQualityFallback();
        }}
      />
    </Canvas>
  );
}
