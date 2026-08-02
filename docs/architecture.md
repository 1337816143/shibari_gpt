# 架构说明

## 分层

- `schemas/`：Zod 运行时 Schema，是课程内容进入播放器的边界。
- `data/`：课程配置与经过登记的模型资产候选；页面组件不写死步骤内容。
- `components/scene/`：人物资产适配、绳路、操作手、方向箭头、接触点、错误对比、相机和渲染性能。
- `components/ui/`：播放器、视角工具栏、步骤说明、课程库和二维降级图。
- `hooks/`：播放状态机和版本化本地学习记录。
- `docs/`：参考站分析、研究协议、模型流程、许可证、验收门槛和生成提示词。

## 课程数据边界

课程 Schema 显式记录：

- 分类、标签、预计时长和学习目标；
- 模型资产类型、许可证、归属和审核状态；
- GLB 来源、许可证地址、远程加载权限、变换参数和可选校验值；
- 推荐视角、绳路、操作手、绳头方向；
- 接触点、检查点、风险点；
- 错误状态的独立绳路；
- 本步完成检查、停止条件和解除方式。

播放器不根据文字自动猜测三维路径。所有坐标必须来自可人工编辑的课程配置，正式发布前还要迁移到已审核的人体 landmark 或骨骼局部坐标。

## 模型资产链路

`ModelAssetRenderer` 现在负责统一渲染两类资产：

- `procedural`：项目内的安全占位训练模型；
- `glb`：具有完整来源、许可和变换元数据的外部或本地 GLB。

带骨骼 GLB 使用 `SkeletonUtils.clone` 创建独立场景实例，避免课程切换或多实例渲染时共用骨骼状态。材质按实例克隆，以便透明度调整不会污染加载缓存中的原始材质。

资产级错误边界只替换人物模型：远程加载未授权、网络失败或 GLB 解析失败时，自动回退到程序化训练模型。绳路、步骤说明和安全提示仍保持可用。整个 WebGL 场景失败时，外层 `SceneBoundary` 再切换到二维分步图。

登记在 `src/data/modelAssets.ts` 的 Khronos `RiggedFigure` 仅用于加载器、皮肤和骨骼链路 QA，不是正式成年女性教学人物，也不作为默认课程资产。

## 性能原则

- 首页不加载 Three.js；用户进入练习室并完成安全确认后才动态导入 3D 引擎。
- 二维分步图不依赖 Three.js，可用于低性能设备、WebGL 初始化失败或快速方向核对。
- PerformanceMonitor 检测性能下降后降低到 DPR 1 和低画质。
- 画质切换会同步更新 DPR，而不是只更新 UI 状态。
- 绳路基于课程控制点生成，历史绳段不在每一帧重复创建业务状态。
- GLB 实例释放克隆材质；生产资产还必须管理纹理、几何体、动画 mixer 和加载缓存的生命周期。

## 学习记录

学习记录使用版本化 localStorage key：

`shibari-studio:learning:v1:<courseId>`

仅保存：

- 是否收藏；
- 已完成复查的步骤 ID；
- 上次查看的步骤。

该记录不上传服务器，也不把“播放完成”等同于“技法已掌握”。用户必须主动完成本步检查后标记。

## 下一层模型接口

当前资产适配器已经解决 GLB 加载、实例隔离、透明度和失败回退，但还没有完成姿势驱动与人体坐标绑定。后续接口应提供：

```ts
interface TeachingModelAdapter {
  applyPose(poseId: string): void;
  getLandmark(name: string): THREE.Vector3;
  getBone(name: string): THREE.Bone | undefined;
  validatePose(poseId: string): PoseValidationResult;
  dispose(): void;
}
```

绳路、风险区和接触点最终应绑定到审核过的人体 landmark / bone local space，而不是绝对世界坐标。更换人物模型后，相关姿势、绳路和安全审核必须自动失效并重新确认。
