import type { CourseStep } from '../../schemas/course';

interface StepDiagramProps {
  step: CourseStep;
  progress: number;
  mirrored: boolean;
  showErrors: boolean;
}

const roleClass = {
  completed: 'diagram-rope diagram-rope--completed',
  current: 'diagram-rope diagram-rope--current',
  tail: 'diagram-rope diagram-rope--tail',
};

function project([x, y]: readonly [number, number, number], mirrored: boolean): [number, number] {
  const projectedX = 310 + (mirrored ? -x : x) * 170;
  const projectedY = 360 - y * 145;
  return [projectedX, projectedY];
}

function pointsString(points: ReadonlyArray<readonly [number, number, number]>, mirrored: boolean, progress = 1) {
  const visibleCount = Math.max(2, Math.ceil(points.length * progress));
  return points.slice(0, visibleCount).map((item) => project(item, mirrored).join(',')).join(' ');
}

export function StepDiagram({ step, progress, mirrored, showErrors }: StepDiagramProps) {
  const errorState = step.errorStates[0];
  return (
    <div className="step-diagram" role="img" aria-label={`${step.title}的简化二维绳路图`}>
      <svg viewBox="0 0 620 420">
        <defs>
          <marker id="diagram-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        <g className="diagram-body">
          <circle cx="310" cy="68" r="34" />
          <path d="M270 116 Q310 95 350 116 L370 242 Q310 270 250 242 Z" />
          <path d="M274 130 L205 235" />
          <path d="M346 130 L440 216" />
          <path d="M286 248 L272 382" />
          <path d="M334 248 L348 382" />
        </g>
        {step.ropeSegments.map((segment) => (
          <polyline
            key={segment.id}
            className={roleClass[segment.role]}
            points={pointsString(segment.points, mirrored, segment.role === 'completed' ? 1 : progress)}
          />
        ))}
        {step.directionCue && (
          <line
            className="diagram-direction"
            x1={project(step.directionCue.from, mirrored)[0]}
            y1={project(step.directionCue.from, mirrored)[1]}
            x2={project(step.directionCue.to, mirrored)[0]}
            y2={project(step.directionCue.to, mirrored)[1]}
            markerEnd="url(#diagram-arrow)"
          />
        )}
        {step.contactPoints.map((marker) => {
          const [cx, cy] = project(marker.position, mirrored);
          return <circle key={marker.id} className={`diagram-marker diagram-marker--${marker.kind}`} cx={cx} cy={cy} r="8" />;
        })}
        {showErrors && errorState?.ropeSegments.map((segment) => (
          <polyline key={segment.id} className="diagram-rope diagram-rope--error" points={pointsString(segment.points, mirrored)} />
        ))}
      </svg>
      <div className="diagram-caption">
        <strong>简化分步图</strong>
        <span>用于低性能设备或 WebGL 不可用时的方向核对，不替代已审核的三维姿势与绳路。</span>
      </div>
    </div>
  );
}
