import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { CourseStep } from '../../schemas/course';

type Point3 = [number, number, number];

interface TeachingOverlaysProps {
  step: CourseStep;
  mirrored: boolean;
  showCues: boolean;
  showContacts: boolean;
  showRisks: boolean;
  showErrors: boolean;
}

function point(tuple: readonly [number, number, number], mirrored: boolean): Point3 {
  return [mirrored ? -tuple[0] : tuple[0], tuple[1], tuple[2]];
}

function DirectionArrow({ from, to, mirrored, label }: {
  from: readonly [number, number, number];
  to: readonly [number, number, number];
  mirrored: boolean;
  label: string;
}) {
  const start = point(from, mirrored);
  const end = point(to, mirrored);
  const direction = new THREE.Vector3(...end).sub(new THREE.Vector3(...start)).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

  return (
    <group>
      <Line points={[start, end]} color="#ffe0a3" lineWidth={4} dashed dashScale={10} />
      <mesh position={end} quaternion={quaternion}>
        <coneGeometry args={[0.055, 0.18, 18]} />
        <meshBasicMaterial color="#ffe0a3" depthTest={false} />
      </mesh>
      <Html position={end} center distanceFactor={8}>
        <div className="scene-label scene-label--cue">{label}</div>
      </Html>
    </group>
  );
}

function HandOverlay({ cue, mirrored }: { cue: NonNullable<CourseStep['handCue']>; mirrored: boolean }) {
  const position = point(cue.position, mirrored);
  const target = point(cue.target, mirrored);
  const delta: Point3 = [target[0] - position[0], target[1] - position[1], target[2] - position[2]];

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.085, 20, 16]} />
        <meshBasicMaterial color="#72c8ff" transparent opacity={0.72} depthWrite={false} />
      </mesh>
      <Line points={[[0, 0, 0], delta]} color="#72c8ff" lineWidth={3} dashed />
      <Html position={[0, 0.16, 0]} center distanceFactor={8}>
        <div className="scene-label scene-label--hand">{cue.label}</div>
      </Html>
    </group>
  );
}

export function TeachingOverlays({ step, mirrored, showCues, showContacts, showRisks, showErrors }: TeachingOverlaysProps) {
  const errorState = step.errorStates[0];

  return (
    <group>
      {showCues && step.directionCue && (
        <DirectionArrow
          from={step.directionCue.from}
          to={step.directionCue.to}
          mirrored={mirrored}
          label={step.directionCue.label}
        />
      )}

      {showCues && step.handCue && <HandOverlay cue={step.handCue} mirrored={mirrored} />}

      {step.contactPoints.map((marker) => {
        const visible = marker.kind === 'risk' ? showRisks : showContacts;
        if (!visible) return null;
        const markerColor = marker.kind === 'risk' ? '#ef6b70' : marker.kind === 'check' ? '#75c8a1' : '#72c8ff';
        return (
          <group key={marker.id} position={point(marker.position, mirrored)}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.1, 0.018, 10, 36]} />
              <meshBasicMaterial color={markerColor} transparent opacity={0.9} depthWrite={false} />
            </mesh>
            <Html position={[0, 0.15, 0]} center distanceFactor={8}>
              <div className={`scene-label scene-label--${marker.kind}`}>{marker.label}</div>
            </Html>
          </group>
        );
      })}

      {showErrors && errorState && (
        <group>
          {errorState.ropeSegments.map((segment) => {
            const errorPoints = segment.points.map((item) => point(item, mirrored));
            return <Line key={segment.id} points={errorPoints} color="#ff5f67" lineWidth={8} transparent opacity={0.88} />;
          })}
          <Html position={point(step.focusPoint, mirrored)} center distanceFactor={7}>
            <div className="scene-label scene-label--danger">{errorState.label}</div>
          </Html>
        </group>
      )}
    </group>
  );
}
