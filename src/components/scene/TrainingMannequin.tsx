import type { ThreeElements } from '@react-three/fiber';
import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';

type TrainingMannequinProps = ThreeElements['group'] & {
  opacity: number;
};

interface LimbProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  radius: number;
  length: number;
  material: THREE.Material;
  castShadow?: boolean;
}

function Limb({ position, rotation = [0, 0, 0], radius, length, material, castShadow = true }: LimbProps) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow={castShadow}>
      <capsuleGeometry args={[radius, length, 14, 24]} />
    </mesh>
  );
}

function JointMarker({ position, scale = 1, material }: { position: [number, number, number]; scale?: number; material: THREE.Material }) {
  return (
    <mesh position={position} scale={scale} material={material}>
      <torusGeometry args={[0.115, 0.012, 8, 32]} />
    </mesh>
  );
}

export const TrainingMannequin = memo(function TrainingMannequin({ opacity, ...props }: TrainingMannequinProps) {
  const materials = useMemo(() => ({
    skin: new THREE.MeshStandardMaterial({ color: '#c89a82', roughness: 0.72, metalness: 0.01 }),
    suit: new THREE.MeshStandardMaterial({ color: '#24383b', roughness: 0.58, metalness: 0.03 }),
    suitPanel: new THREE.MeshStandardMaterial({ color: '#36585c', roughness: 0.5, metalness: 0.03 }),
    seam: new THREE.MeshStandardMaterial({ color: '#8fb0b1', roughness: 0.45 }),
    hair: new THREE.MeshStandardMaterial({ color: '#302824', roughness: 0.88 }),
    eye: new THREE.MeshStandardMaterial({ color: '#342f2d', roughness: 0.45 }),
  }), []);

  useEffect(() => {
    const transparent = opacity < 0.99;
    Object.values(materials).forEach((material) => {
      material.transparent = transparent;
      material.opacity = opacity;
      material.depthWrite = opacity > 0.45;
      material.needsUpdate = true;
    });
  }, [materials, opacity]);

  useEffect(() => () => Object.values(materials).forEach((material) => material.dispose()), [materials]);

  return (
    <group {...props}>
      {/* Head and neutral facial landmarks */}
      <mesh position={[0, 2.72, 0.015]} scale={[0.21, 0.27, 0.2]} material={materials.skin} castShadow>
        <sphereGeometry args={[1, 40, 32]} />
      </mesh>
      <mesh position={[0, 2.84, -0.08]} scale={[0.225, 0.21, 0.18]} material={materials.hair} castShadow>
        <sphereGeometry args={[1, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
      </mesh>
      <mesh position={[0, 2.71, 0.205]} scale={[0.035, 0.055, 0.035]} material={materials.skin}>
        <sphereGeometry args={[1, 18, 12]} />
      </mesh>
      <mesh position={[-0.072, 2.77, 0.19]} scale={[0.022, 0.012, 0.01]} material={materials.eye}>
        <sphereGeometry args={[1, 12, 8]} />
      </mesh>
      <mesh position={[0.072, 2.77, 0.19]} scale={[0.022, 0.012, 0.01]} material={materials.eye}>
        <sphereGeometry args={[1, 12, 8]} />
      </mesh>
      <Limb position={[0, 2.43, 0]} radius={0.085} length={0.16} material={materials.skin} />

      {/* Ribcage, waist and pelvis: fitted sleeveless training suit */}
      <mesh position={[0, 2.08, 0]} scale={[0.44, 0.54, 0.27]} material={materials.suit} castShadow>
        <sphereGeometry args={[1, 42, 30]} />
      </mesh>
      <mesh position={[0, 1.72, 0]} scale={[0.31, 0.39, 0.23]} material={materials.suit} castShadow>
        <sphereGeometry args={[1, 36, 26]} />
      </mesh>
      <mesh position={[0, 1.42, 0]} scale={[0.43, 0.32, 0.29]} material={materials.suit} castShadow>
        <sphereGeometry args={[1, 36, 26]} />
      </mesh>
      <mesh position={[0, 2.04, 0.265]} scale={[0.29, 0.39, 0.018]} material={materials.suitPanel}>
        <sphereGeometry args={[1, 28, 20]} />
      </mesh>
      <mesh position={[0, 1.51, 0.285]} scale={[0.32, 0.18, 0.014]} material={materials.suitPanel}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      <mesh position={[0, 1.7, 0.24]} material={materials.seam}>
        <torusGeometry args={[0.25, 0.009, 8, 48]} />
      </mesh>

      {/* Left arm: relaxed, with visible shoulder, elbow and wrist landmarks */}
      <group position={[-0.44, 2.19, 0]} rotation={[0.02, 0.02, -0.08]}>
        <mesh position={[0, 0, 0]} scale={[0.14, 0.15, 0.14]} material={materials.skin} castShadow>
          <sphereGeometry args={[1, 24, 18]} />
        </mesh>
        <Limb position={[-0.045, -0.34, 0]} rotation={[0, 0, 0.12]} radius={0.105} length={0.48} material={materials.skin} />
        <mesh position={[-0.09, -0.68, 0]} scale={[0.105, 0.105, 0.1]} material={materials.skin} castShadow>
          <sphereGeometry args={[1, 20, 16]} />
        </mesh>
        <Limb position={[-0.105, -0.99, 0.035]} rotation={[0.04, 0, 0.02]} radius={0.085} length={0.43} material={materials.skin} />
        <mesh position={[-0.11, -1.28, 0.07]} scale={[0.105, 0.17, 0.065]} material={materials.skin} castShadow>
          <sphereGeometry args={[1, 22, 16]} />
        </mesh>
        <JointMarker position={[-0.09, -0.68, 0.105]} scale={0.65} material={materials.seam} />
        <JointMarker position={[-0.11, -1.21, 0.08]} scale={0.48} material={materials.seam} />
      </group>

      {/* Right arm: supported teaching pose. Forearm stays near the audited rope coordinates. */}
      <group position={[0.43, 2.18, 0]} rotation={[0.03, -0.04, 0.08]}>
        <mesh scale={[0.14, 0.15, 0.14]} material={materials.skin} castShadow>
          <sphereGeometry args={[1, 24, 18]} />
        </mesh>
        <Limb position={[0.11, -0.3, 0.01]} rotation={[0.02, 0, -0.32]} radius={0.105} length={0.44} material={materials.skin} />
        <mesh position={[0.26, -0.58, 0.02]} scale={[0.108, 0.105, 0.102]} material={materials.skin} castShadow>
          <sphereGeometry args={[1, 20, 16]} />
        </mesh>
        <Limb position={[0.48, -0.72, 0.055]} rotation={[0.02, 0.06, 1.02]} radius={0.087} length={0.48} material={materials.skin} />
        <mesh position={[0.79, -0.82, 0.08]} scale={[0.16, 0.105, 0.07]} rotation={[0.02, 0.03, 1.05]} material={materials.skin} castShadow>
          <sphereGeometry args={[1, 24, 18]} />
        </mesh>
        <mesh position={[0.91, -0.76, 0.09]} scale={[0.055, 0.11, 0.045]} rotation={[0.1, 0, 0.65]} material={materials.skin}>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
        <JointMarker position={[0.26, -0.58, 0.125]} scale={0.66} material={materials.seam} />
        <JointMarker position={[0.72, -0.78, 0.14]} scale={0.5} material={materials.seam} />
      </group>

      {/* Legs and feet: stable, symmetrical support */}
      <group position={[-0.22, 1.26, 0]}>
        <Limb position={[0, -0.42, 0]} radius={0.145} length={0.62} material={materials.suit} />
        <mesh position={[0, -0.86, 0]} scale={[0.14, 0.12, 0.13]} material={materials.suitPanel} castShadow>
          <sphereGeometry args={[1, 22, 16]} />
        </mesh>
        <Limb position={[0, -1.27, 0.015]} radius={0.105} length={0.63} material={materials.suit} />
        <mesh position={[0, -1.72, 0.12]} scale={[0.15, 0.09, 0.27]} material={materials.suit} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
        <JointMarker position={[0, -0.86, 0.14]} scale={0.7} material={materials.seam} />
      </group>
      <group position={[0.22, 1.26, 0]}>
        <Limb position={[0, -0.42, 0]} radius={0.145} length={0.62} material={materials.suit} />
        <mesh position={[0, -0.86, 0]} scale={[0.14, 0.12, 0.13]} material={materials.suitPanel} castShadow>
          <sphereGeometry args={[1, 22, 16]} />
        </mesh>
        <Limb position={[0, -1.27, 0.015]} radius={0.105} length={0.63} material={materials.suit} />
        <mesh position={[0, -1.72, 0.12]} scale={[0.15, 0.09, 0.27]} material={materials.suit} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
        <JointMarker position={[0, -0.86, 0.14]} scale={0.7} material={materials.seam} />
      </group>
    </group>
  );
});
