import { BookOpenCheck, Check, CircleAlert, Clock3, Heart, Layers3, Menu, RotateCcw, ShieldCheck, Sparkles, X } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AssetTransparencyPanel } from './components/ui/AssetTransparencyPanel';
import { CourseLibrary } from './components/ui/CourseLibrary';
import { Glossary } from './components/ui/Glossary';
import { PlayerControls } from './components/ui/PlayerControls';
import { SceneBoundary } from './components/ui/SceneBoundary';
import { SceneToolbar } from './components/ui/SceneToolbar';
import { StepDiagram } from './components/ui/StepDiagram';
import { StepPanel } from './components/ui/StepPanel';
import { demoCourse } from './data/demoCourse';
import { riggedFigureQaAsset } from './data/modelAssets';
import { useLearningProgress } from './hooks/useLearningProgress';
import { usePlayback } from './hooks/usePlayback';
import type { SceneSettings } from './types/scene';
import './scene-launch.css';
import './consent-modal.css';

const StudioScene = lazy(() =>
  import('./components/scene/StudioScene').then((module) => ({ default: module.StudioScene })),
);

const initialSettings: SceneSettings = {
  viewPreset: 'front',
  quality: 'standard',
  renderMode: '3d',
  mirrored: false,
  modelVisible: true,
  modelOpacity: 1,
  completedRopeVisible: true,
  riskOverlayVisible: true,
  contactOverlayVisible: true,
  teachingCuesVisible: true,
  errorOverlayVisible: false,
  cameraLocked: false,
  autoFollow: true,
};

export function App() {
  const course = demoCourse;
  const learning = useLearningProgress(course.id);
  const { setLastStepIndex } = learning;
  const playback = usePlayback(course.steps.length, learning.lastStepIndex);
  const [settings, setSettings] = useState(initialSettings);
  const [menuOpen, setMenuOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [studioActivated, setStudioActivated] = useState(false);
  const [usingQaAsset, setUsingQaAsset] = useState(false);
  const step = course.steps[playback.stepIndex] ?? course.steps[0];
  const activeModelAsset = usingQaAsset ? riggedFigureQaAsset : course.modelAsset;

  if (!step) throw new Error('Course has no steps');

  const animationCompletion = useMemo(
    () => Math.round(((playback.stepIndex + playback.progress) / course.steps.length) * 100),
    [course.steps.length, playback.progress, playback.stepIndex],
  );
  const masteryCompletion = Math.round((learning.completedStepIds.length / course.steps.length) * 100);
  const modelAssetLabel = activeModelAsset.kind === 'glb'
    ? `GLB · ${activeModelAsset.status}`
    : '程序化占位模型 · 待审核';

  useEffect(() => {
    setLastStepIndex(playback.stepIndex);
  }, [playback.stepIndex, setLastStepIndex]);

  const sceneSettings: SceneSettings = settings.autoFollow
    ? { ...settings, viewPreset: step.recommendedView }
    : settings;

  const activateStudio = () => {
    setStudioActivated(true);
    setMenuOpen(false);
  };

  const handleNext = () => {
    learning.markStepComplete(step.id);
    playback.next();
  };

  const handleReset = () => {
    learning.reset();
    playback.goToStep(0);
    setAcknowledged(false);
    setUsingQaAsset(false);
  };

  const toggleQaAsset = () => {
    setUsingQaAsset((current) => {
      const next = !current;
      setNotice(next
        ? '已选择技术 QA 模型；它只验证 GLB 管线，不代表正式课程人物。'
        : '已返回课程程序化占位模型。');
      return next;
    });
  };

  const diagram = (
    <StepDiagram
      step={step}
      progress={playback.progress}
      mirrored={settings.mirrored}
      showErrors={settings.errorOverlayVisible}
    />
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Shibari Studio 首页">
          <span className="brand-mark"><Layers3 size={20} /></span>
          <span><strong>Shibari Studio</strong><small>3D Safety-first Learning</small></span>
        </a>
        <nav className={menuOpen ? 'nav is-open' : 'nav'}>
          <a href="#library">课程库</a>
          <a href="#course" onClick={activateStudio}>练习室</a>
          <a href="#path">学习路径</a><a href="#safety">安全入门</a><a href="#glossary">术语表</a><a href="#research">研究与审核</a>
        </nav>
        <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="切换菜单">{menuOpen ? <X /> : <Menu />}</button>
        <div className="status-chip"><span />第四阶段 PoC · 未经课程审核</div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero__copy">
            <span className="kicker"><Sparkles size={16} />可旋转人物 · 分步绳路 · 步骤安全提示</span>
            <h1>把每一段绳路，<br /><em>看清楚再练习。</em></h1>
            <p>面向成年学习者的 3D 互动教学原型。现在加入受控 GLB 下载、体积和哈希校验、加载超时、模型诊断、资产来源与审核透明度；仍不替代线下专业指导。</p>
            <div className="hero__actions">
              <a className="primary-button" href="#course" onClick={activateStudio}>进入 3D 练习室</a>
              <a className="secondary-button" href="#library">浏览课程库</a>
            </div>
            <div className="hero__metrics"><span><strong>360°</strong>自由视角</span><span><strong>{course.steps.length}</strong>独立步骤</span><span><strong>GLB/2D</strong>双重回退</span></div>
          </div>
          <div className="hero__visual" aria-hidden="true">
            <div className="orb orb--one" /><div className="orb orb--two" />
            <div className="hero-card"><ShieldCheck size={32} /><strong>Safety is contextual</strong><span>风险提示绑定具体姿势、接触位置和操作步骤。</span></div>
          </div>
        </section>

        <CourseLibrary activeCourse={course} onOpenCourse={activateStudio} />

        <section id="course" className="course-layout">
          <header className="section-heading course-heading">
            <div><span className="eyebrow">示范课程 · Prototype only</span><h2>{course.title}</h2><p>{course.summary}</p></div>
            <div className="course-heading__actions">
              <button className={learning.favorite ? 'is-active' : ''} onClick={learning.toggleFavorite} aria-label={learning.favorite ? '取消收藏课程' : '收藏课程'}><Heart size={17} fill={learning.favorite ? 'currentColor' : 'none'} />{learning.favorite ? '已收藏' : '收藏'}</button>
              <button onClick={handleReset}><RotateCcw size={17} />重置记录</button>
            </div>
          </header>

          <div className="course-overview">
            <article><span>预计时长</span><strong><Clock3 size={17} />{course.estimatedMinutes} 分钟</strong></article>
            <article><span>难度与风险</span><strong>入门 · 低风险 · 非承重</strong></article>
            <article><span>学习进度</span><strong>{learning.completedStepIds.length}/{course.steps.length} 步</strong><div className="mastery-meter"><i style={{ width: `${masteryCompletion}%` }} /></div></article>
            <article><span>资产状态</span><strong>{modelAssetLabel}</strong></article>
          </div>

          <div className="course-brief-grid">
            <article><h3>学习目标</h3><ul>{course.learningObjectives.map((item) => <li key={item}>{item}</li>)}</ul></article>
            <article><h3>前置知识</h3><ul>{course.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></article>
            <article><h3>所需材料</h3><ul>{course.equipment.map((item) => <li key={item}>{item}</li>)}</ul></article>
          </div>

          {studioActivated && !acknowledged && (
            <div className="consent-modal">
              <div className="consent-banner" role="alertdialog" aria-modal="true" aria-labelledby="consent-title">
                <CircleAlert size={22} />
                <div><strong id="consent-title">开始前确认</strong><p>本课程是工程原型，不是已经通过专业绳师和医疗安全审查的正式教程。禁止承重、吊缚或在无法立即解除的环境中使用。</p></div>
                <button onClick={() => setAcknowledged(true)}><Check size={17} />我已了解</button>
              </div>
            </div>
          )}

          <div className="studio-grid">
            <div className="viewer-column">
              <div className="viewer-card">
                <div className="viewer-badge">STEP {String(playback.stepIndex + 1).padStart(2, '0')}</div>
                {settings.renderMode === 'diagram' ? diagram : studioActivated && acknowledged ? (
                  <SceneBoundary
                    fallback={diagram}
                    onError={() => {
                      setSettings((current) => ({ ...current, renderMode: 'diagram' }));
                      setNotice('3D 场景无法初始化，已切换到简化分步图。');
                    }}
                  >
                    <Suspense fallback={<div className="scene-launch scene-launch--loading"><span>正在按需加载 3D 引擎…</span></div>}>
                      <StudioScene
                        course={course}
                        modelAsset={activeModelAsset}
                        step={step}
                        progress={playback.progress}
                        settings={sceneSettings}
                        onQualityFallback={() => {
                          setSettings((current) => ({ ...current, quality: 'low' }));
                          setNotice('检测到性能下降，已切换到低性能模式。');
                        }}
                      />
                    </Suspense>
                  </SceneBoundary>
                ) : studioActivated ? (
                  <div className="scene-launch scene-launch--consent">
                    <ShieldCheck size={34} />
                    <strong>请先完成安全确认</strong>
                    <span>确认前不会下载 3D 引擎；确认后才会初始化 WebGL 教学场景。</span>
                  </div>
                ) : (
                  <button className="scene-launch" onClick={activateStudio}>
                    <Layers3 size={34} />
                    <strong>加载 3D 练习室</strong>
                    <span>点击后先完成安全确认；确认前不会下载 3D 引擎。</span>
                  </button>
                )}
                {notice && <button className="performance-notice" onClick={() => setNotice(null)}>{notice}<X size={14} /></button>}
              </div>
              <SceneToolbar settings={sceneSettings} onChange={setSettings} />
              <PlayerControls
                stepIndex={playback.stepIndex}
                stepCount={course.steps.length}
                progress={playback.progress}
                playing={playback.playing}
                loopStep={playback.loopStep}
                speed={playback.speed}
                speeds={playback.speeds}
                onPrevious={playback.previous}
                onNext={handleNext}
                onPlayToggle={() => playback.setPlaying(!playback.playing)}
                onReplay={playback.replay}
                onLoopToggle={() => playback.setLoopStep(!playback.loopStep)}
                onProgress={playback.setProgress}
                onSpeed={(value) => playback.setSpeed(value as 0.25 | 0.5 | 1 | 1.5)}
              />
              <div className="step-strip">
                {course.steps.map((item, index) => {
                  const complete = learning.completedStepIds.includes(item.id);
                  return (
                    <button key={item.id} className={index === playback.stepIndex ? 'is-active' : complete ? 'is-complete' : ''} onClick={() => playback.goToStep(index)}>
                      <span>{complete ? <Check size={14} /> : index + 1}</span><small>{item.title}</small>
                    </button>
                  );
                })}
                <div className="progress-line" style={{ width: `${animationCompletion}%` }} />
              </div>
            </div>
            <StepPanel
              step={step}
              completed={learning.completedStepIds.includes(step.id)}
              onToggleComplete={() => learning.toggleStepComplete(step.id)}
            />
          </div>
        </section>

        <AssetTransparencyPanel
          course={course}
          activeAsset={activeModelAsset}
          usingQaAsset={usingQaAsset}
          onToggleQaAsset={toggleQaAsset}
        />

        <section id="path" className="content-section">
          <div className="section-heading"><div><span className="eyebrow">渐进式学习路径</span><h2>先建立安全能力，再增加技法复杂度</h2></div></div>
          <div className="path-grid">
            <article><span>01</span><ShieldCheck /><h3>沟通与安全</h3><p>停止信号、安全剪、循环与神经检查、快速解除。</p></article>
            <article><span>02</span><BookOpenCheck /><h3>基础绳索操作</h3><p>绳索整理、方向、张力、平行绳股、单柱和双柱基础。</p></article>
            <article><span>03</span><Layers3 /><h3>身体绳路</h3><p>在姿势和解剖标志经过审核后，进入身体路径教学。</p></article>
          </div>
        </section>

        <section id="safety" className="safety-section">
          <div><span className="eyebrow">医学与风险依据</span><h2>麻木、刺痛、疼痛或无力，不是“正常反应”。</h2><p>持续压力可能造成周围神经损伤。原型将停止条件、接触位置和复查要求放入每一步，而不是只放在免责声明中。</p></div>
          <div className="safety-grid"><article><strong>立即停止</strong><span>麻木、刺痛、灼痛、电击感、运动无力。</span></article><article><strong>循环复查</strong><span>颜色、温度、感觉、主动运动与对称性。</span></article><article><strong>快速解除</strong><span>活动绳头不可立即识别时，使用安全剪。</span></article></div>
        </section>

        <Glossary />

        <section id="research" className="content-section research-section">
          <div className="section-heading"><div><span className="eyebrow">研究与资产状态</span><h2>不伪装任何模型或课程的完成度</h2></div></div>
          <div className="research-grid">
            <article><h3>已完成</h3><ul><li>参考网站结构与交互分析</li><li>课程、姿势、绳路、安全检查与审核记录 Schema</li><li>GLB 受控下载、超时、体积和 SHA-256 校验</li><li>骨骼安全克隆、模型诊断与模型级失败回退</li><li>资产来源、许可和审核状态展示</li><li>学习记录、锁定依赖、确认后按需加载 3D 和 2D 降级</li></ul></article>
            <article><h3>生产发布阻塞项</h3><ul><li>最终写实成年女性着装模型</li><li>课程姿势、骨骼权重和人体 landmark 验收</li><li>专业绳师逐步校验绳路</li><li>医学/人体结构安全审核</li><li>GLB 压缩、LOD、纹理压缩和真机性能测试</li></ul></article>
            <article className="warning-card"><h3>生成工具边界</h3><p>img2threejs 仍不能替代生产级人物重建、拓扑、绑定和权重流程。项目会尝试基于 CC0 MakeHuman/MPFB 资产建立可复现人物管线，但只有通过来源、着装、骨骼、姿势、绳路和性能验收后才会替换默认占位模型。</p></article>
          </div>
        </section>
      </main>

      <footer><span>Shibari Studio Phase 4 PoC</span><span>成年人 · 安全优先 · 未审核课程不得发布</span></footer>
    </div>
  );
}
