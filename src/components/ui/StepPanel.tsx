import { AlertTriangle, Check, CheckCircle2, CircleStop, Hand, Info, MapPin, RotateCcw, TriangleAlert } from 'lucide-react';
import type { CourseStep } from '../../schemas/course';

interface StepPanelProps {
  step: CourseStep;
  completed: boolean;
  onToggleComplete: () => void;
}

const safetyIcon = {
  info: <Info size={17} />,
  warning: <AlertTriangle size={17} />,
  stop: <CircleStop size={17} />,
};

export function StepPanel({ step, completed, onToggleComplete }: StepPanelProps) {
  const errorState = step.errorStates[0];
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
        {step.handCue && <div className="cue-line"><Hand size={16} /><span>{step.handCue.label}</span></div>}
        {step.directionCue && <div className="cue-line"><MapPin size={16} /><span>{step.directionCue.label}</span></div>}
      </section>
      <section className="instruction-card">
        <h3>松紧与检查</h3>
        <p>{step.tensionGuidance}</p>
        <div className="check-line"><CheckCircle2 size={17} />{step.verification}</div>
      </section>
      <section>
        <h3>本步完成检查</h3>
        <ul className="completion-list">{step.completionChecklist.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul>
      </section>
      <section>
        <h3>接触位置与观察点</h3>
        <div className="contact-list">
          {step.contactPoints.map((point) => <article key={point.id} className={`contact-item contact-item--${point.kind}`}><strong>{point.label}</strong><span>{point.note}</span></article>)}
        </div>
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
        {errorState && <div className="error-explainer"><TriangleAlert size={17} /><div><strong>{errorState.label}</strong><p>{errorState.description}</p><span>{errorState.risk}</span></div></div>}
      </section>
      <section className="release-card">
        <h3><RotateCcw size={17} />解除方式</h3>
        <p>{step.releaseInstruction}</p>
      </section>
      <button className={`mastery-button ${completed ? 'is-complete' : ''}`} onClick={onToggleComplete}>
        <CheckCircle2 size={18} />{completed ? '已完成本步复查' : '标记本步已完成复查'}
      </button>
    </aside>
  );
}
