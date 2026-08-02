# 架构说明

## 分层

- `schemas/`：Zod 运行时 Schema，是课程内容进入播放器的边界。
- `data/`：课程配置；页面组件不写死步骤内容。
- `components/scene/`：人物、绳路、操作手、方向箭头、接触点、错误对比、相机和渲染性能。
- `components/ui/`：播放器、视角工具栏、步骤说明、课程库和二维降级图。
- `hooks/`：播放状态机和版本化本地学习记录。
- `docs/`：参考站分析、研究协议、模型流程、许可证和生成提示词。

## 课程数据边界

课程 Schema 现在显式记录：

- 分类、标签、预计时长和学习目标；
- 模型资产类型、许可证、归属和审核状态；
- 推荐视角、绳路、操作手、绳头方向；
- 接触点、检查点、风险点；
- 错误状态的独立绳路；
- 本步完成检查、停止条件和解除方式。

播放器不根据文字自动猜测三维路径。所有坐标必须来自可人工编辑的课程配置，正式发布前还要迁移到已审核的人体 landmark 或骨骼局部坐标。

## 性能原则

- 首页不加载 Three.js；用户进入练习室后才动态导入 3D 引擎。
- 二维分步图不依赖 Three.js，可用于低性能设备、WebGL 初始化失败或快速方向核对。
- PerformanceMonitor 检测性能下降后降低到 DPR 1 和低画质。
- 画质切换会同步更新 DPR，而不是只更新 UI 状态。
- 绳路基于课程控制点生成，历史绳段不在每一帧重复创建业务状态。
- 生产 GLB 版必须按课程释放纹理、几何体、材质、动画 mixer 和缓存引用。

## 学习记录

学习记录使用版本化 localStorage key：

`shibari-studio:learning:v1:<courseId>`

仅保存：

- 是否收藏；
- 已完成复查的步骤 ID；
- 上次查看的步骤。

该记录不上传服务器，也不把“播放完成”等同于“技法已掌握”。用户必须主动完成本步检查后标记。

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

绳路、风险区和接触点最终应绑定到审核过的人体 landmark / bone local space，而不是绝对世界坐标。正式模型必须保留资产许可证、处理日志、模型版本和姿势审核记录。
