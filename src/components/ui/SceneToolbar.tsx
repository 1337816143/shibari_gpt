import { Box, Camera, Eye, EyeOff, FlipHorizontal2, Gauge, Hand, Layers2, Lock, Route, ScanLine, ShieldAlert, Unlock, Waypoints } from 'lucide-react';
import type { QualityMode, SceneSettings, ViewPreset } from '../../types/scene';

const views: Array<{ id: ViewPreset; label: string }> = [
  { id: 'front', label: '正面' },
  { id: 'back', label: '背面' },
  { id: 'left', label: '左侧' },
  { id: 'right', label: '右侧' },
  { id: 'top', label: '顶部' },
  { id: 'detail', label: '局部' },
];

interface SceneToolbarProps {
  settings: SceneSettings;
  onChange: (next: SceneSettings) => void;
}

export function SceneToolbar({ settings, onChange }: SceneToolbarProps) {
  const patch = (partial: Partial<SceneSettings>) => onChange({ ...settings, ...partial });
  return (
    <div className="scene-toolbar" aria-label="3D 场景控制">
      <div className="toolbar-group toolbar-group--views">
        <span className="toolbar-label"><Camera size={15} />视角</span>
        {views.map((view) => (
          <button key={view.id} className={settings.viewPreset === view.id ? 'is-active' : ''} onClick={() => patch({ viewPreset: view.id, autoFollow: false })}>
            {view.label}
          </button>
        ))}
        <button className={settings.autoFollow ? 'is-active' : ''} onClick={() => patch({ autoFollow: !settings.autoFollow })}>
          <ScanLine size={15} />自动跟随
        </button>
      </div>
      <div className="toolbar-group">
        <button onClick={() => patch({ cameraLocked: !settings.cameraLocked })}>
          {settings.cameraLocked ? <Lock size={15} /> : <Unlock size={15} />}
          {settings.cameraLocked ? '解锁视角' : '锁定视角'}
        </button>
        <button className={settings.mirrored ? 'is-active' : ''} onClick={() => patch({ mirrored: !settings.mirrored })}>
          <FlipHorizontal2 size={15} />镜像
        </button>
        <button onClick={() => patch({ modelVisible: !settings.modelVisible })}>
          {settings.modelVisible ? <Eye size={15} /> : <EyeOff size={15} />}
          人物
        </button>
        <button className={settings.completedRopeVisible ? 'is-active' : ''} onClick={() => patch({ completedRopeVisible: !settings.completedRopeVisible })}>
          <Layers2 size={15} />已完成绳段
        </button>
      </div>
      <div className="toolbar-group">
        <button className={settings.teachingCuesVisible ? 'is-active' : ''} onClick={() => patch({ teachingCuesVisible: !settings.teachingCuesVisible })}>
          <Hand size={15} />操作提示
        </button>
        <button className={settings.contactOverlayVisible ? 'is-active' : ''} onClick={() => patch({ contactOverlayVisible: !settings.contactOverlayVisible })}>
          <Waypoints size={15} />接触点
        </button>
        <button className={settings.riskOverlayVisible ? 'is-active is-danger' : ''} onClick={() => patch({ riskOverlayVisible: !settings.riskOverlayVisible })}>
          <ShieldAlert size={15} />风险层
        </button>
        <button className={settings.errorOverlayVisible ? 'is-active is-danger' : ''} onClick={() => patch({ errorOverlayVisible: !settings.errorOverlayVisible })}>
          <Route size={15} />错误对比
        </button>
        <button className={settings.renderMode === 'diagram' ? 'is-active' : ''} onClick={() => patch({ renderMode: settings.renderMode === '3d' ? 'diagram' : '3d' })}>
          <Box size={15} />{settings.renderMode === '3d' ? '简化图' : '返回 3D'}
        </button>
      </div>
      <div className="toolbar-group toolbar-group--sliders">
        <label>
          人物透明度
          <input type="range" min="0.15" max="1" step="0.05" value={settings.modelOpacity} onChange={(event) => patch({ modelOpacity: Number(event.target.value) })} />
        </label>
        <label>
          <Gauge size={15} />画质
          <select value={settings.quality} onChange={(event) => patch({ quality: event.target.value as QualityMode })}>
            <option value="high">高</option>
            <option value="standard">标准</option>
            <option value="low">低性能</option>
          </select>
        </label>
      </div>
    </div>
  );
}
