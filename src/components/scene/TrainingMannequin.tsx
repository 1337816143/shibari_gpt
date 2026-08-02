import type { ThreeElements } from '@react-three/fiber';
import { memo } from 'react';
import * as THREE from 'three';

type TrainingMannequinProps = ThreeElements['group'] & {
  opacity: number;
};

const skin = new THREE.MeshStandardMaterial({ color: '#c99b83', roughness: 0.76 });
const suit = new THREE.MeshStandardMaterial({ color: '#27353a', roughness: 0.64 });
const seam = new THREE.MeshStandardMaterial({ color: '#7d999f', roughness: 0.5 });

export const TrainingMannequin = memo(function TrainingMannequin({ opacity, ...props }: TrainingMannequinProps) {
  const transparent = opacity < 0.99;
  for (const material of [skin, suit, seam]) {
    material.transparent = transparent;
    material.opacity = opacity;
    material.depthWrite = opacity > 0.45;
  }

  return (
    <group {...props}>
      <mesh position={[0, 2.67, 0]} material={skin} castShadow>
        <sphereGeometry args={[0.23, 32, 24]} />
      </mesh>
      <mesh position={[0, 2.35, 0]} material={skin} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.26, 24]} />
      </mesh>
      <mesh position={[0, 1.94, 0]} scale={[0.56, 0.76, 0.32]} material={suit} castShadow>
        <sphereGeometry args={[0.58, 36, 28]} />
      </mesh>
      <mesh position={[0, 1.42, 0]} scale={[0.48, 0.56, 0.31]} material={suit} castShadow>
        <sphereGeometry args={[0.54, 32, 24]} />
      </mesh>
      <mesh position={[0, 1.85, 0.31]} scale={[0.34, 0.5, 0.025]} material={seam}>
        <sphereGeometry args={[0.42, 20, 16]} />
      </mesh>

      <group position={[-0.47, 2.08, 0]} rotation={[0, 0, -0.12]}>
        <mesh position={[0, -0.34, 0]} material={suit} castShadow>
          <capsuleGeometry args={[0.13, 0.48, 12, 20]} />
        </mesh>
        <mesh position={[-0.02, -0.82, 0.12]} rotation={[0.15, 0, 0.1]} material={skin} castShadow>
          <capsuleGeometry args={[0.105, 0.52, 12, 20]} />
        </mesh>
        <mesh position={[-0.02, -1.16, 0.18]} scale={[0.12, 0.2, 0.08]} material={skin} castShadow>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
      </group>

      <group position={[0.47, 2.08, 0]} rotation={[0.05, 0.12, 0.36]}>
        <mesh position={[0.1, -0.3, 0.04]} rotation={[0.1, 0, 0]} material={suit} castShadow>
          <capsuleGeometry args={[0.13, 0.48, 12, 20]} />
        </mesh>
        <mesh position={[0.42, -0.68, 0.12]} rotation={[0.12, 0, 1.02]} material={skin} castShadow>
          <capsuleGeometry args={[0.105, 0.58, 12, 20]} />
        </mesh>
        <mesh position={[0.82, -0.82, 0.12]} scale={[0.12, 0.2, 0.08]} rotation={[0, 0, 0.9]} material={skin} castShadow>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
      </group>

      <group position={[-0.23, 1.12, 0]}>
        <mesh position={[0, -0.45, 0]} material={suit} castShadow>
          <capsuleGeometry args={[0.17, 0.68, 12, 20]} />
        </mesh>
        <mesh position={[0, -1.13, 0.03]} material={skin} castShadow>
          <capsuleGeometry args={[0.13, 0.7, 12, 20]} />
        </mesh>
        <mesh position={[0, -1.62, 0.14]} scale={[0.16, 0.09, 0.3]} material={skin} castShadow>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
      </group>
      <group position={[0.23, 1.12, 0]}>
        <mesh position={[0, -0.45, 0]} material={suit} castShadow>
          <capsuleGeometry args={[0.17, 0.68, 12, 20]} />
        </mesh>
        <mesh position={[0, -1.13, 0.03]} material={skin} castShadow>
          <capsuleGeometry args={[0.13, 0.7, 12, 20]} />
        </mesh>
        <mesh position={[0, -1.62, 0.14]} scale={[0.16, 0.09, 0.3]} material={skin} castShadow>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
      </group>
    </group>
  );
});
