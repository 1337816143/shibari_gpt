# img2threejs 技术评估

## 结论

img2threejs 当前不是“上传多视图后输出完整带骨骼 GLB/GLTF”的图像转 3D 服务。它是面向编码代理的技能/流程：从参考图生成程序化 TypeScript `THREE.Group` 工厂，通过基础几何、生成几何、材质、层级、枢轴和质量门控重建对象。

## 已确认能力

- 输入：当前快速流程以单张参考图为主。
- 输出：TypeScript/Three.js 程序化模型，不是默认 GLB/GLTF 网格资产。
- 人物：有 anatomy-aware character track 和人体比例/特征流程。
- 运行时：可输出枢轴、socket、collider 和可动画层级。
- 依赖：脚本侧要求 Python 3.10+；仓库采用 Apache-2.0。

## 关键限制

- 单图不能可靠恢复隐藏背面和精确几何。
- README 明确说明人物更偏风格化重建，不保证写实人物相似度。
- v1.5 “Character Update”仍在进行，包含拓扑、blendshape、头发和服装。
- 自动绑定、自动权重、Mixamo 兼容和面部 rig 在 v1.8 路线图中。
- 多视图重建在 v2.0 路线图中。
- 因此不能宣称已完成“多视图→完整写实人物 GLB→自动骨骼”的生产流程。

## 本项目策略

1. 当前 PoC 使用程序化成年女性训练模型占位，只验证交互、绳路、相机和课程架构。
2. 预留 `modelId` 和未来 GLB 适配层，不把课程数据绑定到占位模型。
3. 生产人物需经过：统一多视图参考图、专业建模/拓扑、骨骼绑定、权重、姿势校正、压缩、LOD 和人工审核。
4. img2threejs 可作为比例/材质/程序化部件探索工具，而不是未经验证地替代完整人物资产管线。

## 来源

- https://github.com/img2threejs/img2threejs
- Apache License 2.0（仓库 LICENSE）
