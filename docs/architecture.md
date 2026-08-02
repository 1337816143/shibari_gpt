# 架构说明

## 分层

- `schemas/`：Zod 运行时 Schema，是课程内容进入播放器的边界。
- `data/`：课程配置；页面组件不写死步骤内容。
- `components/scene/`：人物、绳路、风险层、相机和渲染性能。
- `components/ui/`：播放器、视角工具栏、步骤说明。
- `hooks/`：播放状态机。
- `docs/`：参考站分析、研究协议、模型流程、许可证和生成提示词。

## 性能原则

- 首页只挂载一个 PoC 场景；后续路由应对 3D 练习室进行动态导入。
- 暂停时仅由 OrbitControls/轻量状态触发更新，未来 GLB 版应启用 `frameloop="demand"`。
- PerformanceMonitor 检测性能下降并降到 DPR 1、低画质。
- 绳路复用课程控制点，避免每帧重建全部历史网格。
- 切课时必须释放纹理、几何体、材质和动画 mixer。

## 生产模型接口计划

程序化占位模型将被 `ModelAdapter` 替换：

```ts
interface ModelAdapter {
  load(modelId: string, quality: 'high' | 'standard' | 'low'): Promise<THREE.Object3D>;
  applyPose(poseId: string): void;
  setOpacity(value: number): void;
  getLandmark(name: string): THREE.Vector3;
  dispose(): void;
}
```

绳路控制点最终应优先绑定到审核过的人体 landmark / bone local space，而不是绝对世界坐标。
