import { BookOpenCheck, Check, CircleAlert, Layers3, Menu, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StudioScene } from './components/scene/StudioScene';
import { PlayerControls } from './components/ui/PlayerControls';
import { SceneToolbar } from './components/ui/SceneToolbar';
import { StepPanel } from './components/ui/StepPanel';
import { demoCourse } from './data/demoCourse';
import { usePlayback } from './hooks/usePlayback';
import type { SceneSettings } from './types/scene';

const initialSettings: SceneSettings = {
  viewPreset: 'front',
  quality: 'standard',
  mirrored: false,
  modelVisible: true,
  modelOpacity: 1,
  completedRopeVisible: true,
  riskOverlayVisible: true,
  cameraLocked: false,
};

export function App() {
  const course = demoCourse;
  const playback = usePlayback(course.steps.length);
  const [settings, setSettings] = useState(initialSettings);
  const [menuOpen, setMenuOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const step = course.steps[playback.stepIndex] ?? course.steps[0];

  if (!step) throw new Error('Course has no steps');

  const completion = useMemo(() => Math.round(((playback.stepIndex + playback.progress) / course.steps.length) * 100), [course.steps.length, playback.progress, playback.stepIndex]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Shibari Studio 首页">
          <span className="brand-mark"><Layers3 size={20} /></span>
          <span><strong>Shibari Studio</strong><small>3D Safety-first Learning</small></span>
        </a>
        <nav className={menuOpen ? 'nav is-open' : 'nav'}>
          <a href="#course">练习室</a><a href="#path">学习路径</a><a href="#safety">安全入门</a><a href="#research">研究与审核</a>
        </nav>
        <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="切换菜单">{menuOpen ? <X /> : <Menu />}</button>
        <div className="status-chip"><span />技术 PoC · 未经课程审核</div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero__copy">
            <span className="kicker"><Sparkles size={16} />可旋转人物 · 分步绳路 · 步骤安全提示</span>
            <h1>把每一段绳路，<br /><em>看清楚再练习。</em></h1>
            <p>一个面向成年学习者的 3D 互动教学原型。当前版本验证相机、绳路、播放器、风险叠层和课程 Schema；不替代线下专业指导。</p>
            <div className="hero__actions"><a className="primary-button" href="#course">进入 3D 练习室</a><a className="secondary-button" href="#research">查看技术限制</a></div>
            <div className="hero__metrics"><span><strong>360°</strong>自由视角</span><span><strong>4</strong>独立步骤</span><span><strong>3</strong>画质档位</span></div>
          </div>
          <div className="hero__visual" aria-hidden="true">
            <div className="orb orb--one" /><div className="orb orb--two" />
            <div className="hero-card"><ShieldCheck size={32} /><strong>Safety is contextual</strong><span>风险提示必须绑定到具体姿势和具体步骤。</span></div>
          </div>
        </section>

        <section id="course" className="course-layout">
          <header className="section-heading">
            <div><span className="eyebrow">示范课程 · Prototype only</span><h2>{course.title}</h2><p>{course.summary}</p></div>
            <div className="course-meta"><span>难度：入门</span><span>风险：低</span><span>版本：{course.courseVersion}</span></div>
          </header>

          {!acknowledged && (
            <div className="consent-banner" role="alert">
              <CircleAlert size={22} />
              <div><strong>开始前确认</strong><p>本课程是工程原型，不是已经通过专业绳师和医疗安全审查的正式教程。禁止承重、吊缚或在无法立即解除的环境中使用。</p></div>
              <button onClick={() => setAcknowledged(true)}><Check size={17} />我已了解</button>
            </div>
          )}

          <div className="studio-grid">
            <div className="viewer-column">
              <div className="viewer-card">
                <div className="viewer-badge">STEP {String(playback.stepIndex + 1).padStart(2, '0')}</div>
                <StudioScene
                  course={course}
                  step={step}
                  progress={playback.progress}
                  settings={settings}
                  onQualityFallback={() => {
                    setSettings((current) => ({ ...current, quality: 'low' }));
                    setNotice('检测到性能下降，已切换到低性能模式。');
                  }}
                />
                {notice && <button className="performance-notice" onClick={() => setNotice(null)}>{notice}<X size={14} /></button>}
              </div>
              <SceneToolbar settings={settings} onChange={setSettings} />
              <PlayerControls
                stepIndex={playback.stepIndex}
                stepCount={course.steps.length}
                progress={playback.progress}
                playing={playback.playing}
                loopStep={playback.loopStep}
                speed={playback.speed}
                speeds={playback.speeds}
                onPrevious={playback.previous}
                onNext={playback.next}
                onPlayToggle={() => playback.setPlaying(!playback.playing)}
                onReplay={playback.replay}
                onLoopToggle={() => playback.setLoopStep(!playback.loopStep)}
                onProgress={playback.setProgress}
                onSpeed={(value) => playback.setSpeed(value as 0.25 | 0.5 | 1 | 1.5)}
              />
              <div className="step-strip">
                {course.steps.map((item, index) => (
                  <button key={item.id} className={index === playback.stepIndex ? 'is-active' : index < playback.stepIndex ? 'is-complete' : ''} onClick={() => playback.goToStep(index)}>
                    <span>{index < playback.stepIndex ? <Check size={14} /> : index + 1}</span><small>{item.title}</small>
                  </button>
                ))}
                <div className="progress-line" style={{ width: `${completion}%` }} />
              </div>
            </div>
            <StepPanel step={step} />
          </div>
        </section>

        <section id="path" className="content-section">
          <div className="section-heading"><div><span className="eyebrow">渐进式学习路径</span><h2>先建立安全能力，再增加技法复杂度</h2></div></div>
          <div className="path-grid">
            <article><span>01</span><ShieldCheck /><h3>沟通与安全</h3><p>停止信号、安全剪、循环与神经检查、快速解除。</p></article>
            <article><span>02</span><BookOpenCheck /><h3>基础绳索操作</h3><p>绳索整理、方向、张力、平行绳股、单柱和双柱基础。</p></article>
            <article><span>03</span><Layers3 /><h3>身体绳路</h3><p>在姿势和解剖标志经过审核后，进入身体路径教学。</p></article>
          </div>
        </section>

        <section id="safety" className="safety-section">
          <div><span className="eyebrow">医学与风险依据</span><h2>麻木、刺痛、疼痛或无力，不是“正常反应”。</h2><p>持续压力可能造成周围神经损伤。原型将“停止条件”放入每一步，而不是只放在免责声明中。</p></div>
          <div className="safety-grid"><article><strong>立即停止</strong><span>麻木、刺痛、灼痛、电击感、运动无力。</span></article><article><strong>循环复查</strong><span>颜色、温度、感觉、主动运动与对称性。</span></article><article><strong>快速解除</strong><span>活动绳头不可立即识别时，使用安全剪。</span></article></div>
        </section>

        <section id="research" className="content-section research-section">
          <div className="section-heading"><div><span className="eyebrow">研究与资产状态</span><h2>不伪装 img2threejs 的能力边界</h2></div></div>
          <div className="research-grid">
            <article><h3>已完成</h3><ul><li>参考网站结构与交互分析</li><li>课程、姿势、绳路、安全检查 Schema</li><li>程序化成年女性训练模型占位</li><li>样条绳路、逐步显示、播放器、视角与镜像</li><li>响应式桌面/手机布局与性能降级</li></ul></article>
            <article><h3>仍需人工完成</h3><ul><li>Image 2 多视图统一人物参考图</li><li>高质量拓扑、骨骼绑定与权重</li><li>专业绳师逐步校验绳路</li><li>医学/人体结构安全审核</li><li>GLB 压缩、LOD、纹理压缩和真机性能测试</li></ul></article>
            <article className="warning-card"><h3>img2threejs 评估</h3><p>当前工具主要从单张参考图生成程序化 TypeScript/Three.js 模型，不是传统的图像转完整网格服务。多视图、自动绑定和动画仍属于后续路线图，因此不能宣称已经产出可直接用于生产的写实带骨骼人物 GLB。</p></article>
          </div>
        </section>
      </main>

      <footer><span>Shibari Studio PoC</span><span>成年人 · 安全优先 · 未审核课程不得发布</span></footer>
    </div>
  );
}
