import { Html } from '@react-three/drei';

interface RiskZonesProps {
  visible: boolean;
  mirrored: boolean;
}

export function RiskZones({ visible, mirrored }: RiskZonesProps) {
  if (!visible) return null;
  const x = mirrored ? -0.82 : 0.82;
  return (
    <group>
      <mesh position={[x, 1.43, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.19, 0.028, 12, 48]} />
        <meshBasicMaterial color="#ef5b61" transparent opacity={0.78} depthWrite={false} />
      </mesh>
      <Html position={[x, 1.73, 0]} center distanceFactor={7}>
        <div className="scene-label scene-label--danger">避免关节褶皱与局部高压</div>
      </Html>
    </group>
  );
}
