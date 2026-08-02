import { AlertTriangle, CheckCircle2, CircleStop, Info, RotateCcw } from 'lucide-react';
import type { CourseStep } from '../../schemas/course';

interface StepPanelProps {
  step: CourseStep;
}

const safetyIcon = {
  info: <Info size={17} />,
  warning: <AlertTriangle size={17} />,
  stop: <CircleStop size={17} />,
};

export function StepPanel({ step }: StepPanelProps) {
  return (
    <aside className="step-panel">
      <header>
        <span className="eyebrow">当前目标</span>
        <h2>{step.title}</h2>
        <p>{step.objective}</p>
      </header>
      <section>
        <h3>操作说明</h3>
        <p>{step.instruction}</p>
      </section>
      <section className="instruction-card">
        <h3>松紧与检查</h3>
        <p>{step.tensionGuidance}</p>
        <div className="check-line"><CheckCircle2 size={17} />{step.verification}</div>
      </section>
      <section>
        <h3>与本步对应的安全提示</h3>
        <div className="safety-list">
          {step.safetyChecks.map((check) => (
            <article key={check.id} className={`safety-item safety-item--${check.severity}`}>
              {safetyIcon[check.severity]}
              <div><strong>{check.label} · {check.bodyRegion}</strong><p>{check.instruction}</p></div>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h3>常见错误</h3>
        <ul>{step.commonErrors.map((error) => <li key={error}>{error}</li>)}</ul>
      </section>
      <section className="release-card">
        <h3><RotateCcw size={17} />解除方式</h3>
        <p>{step.releaseInstruction}</p>
      </section>
    </aside>
  );
}
