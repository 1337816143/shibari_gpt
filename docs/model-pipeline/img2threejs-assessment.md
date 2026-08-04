# img2threejs 技术评估

## 核验版本

- 仓库：`img2threejs/img2threejs`
- README 标示版本：1.4.3
- 许可证：Apache License 2.0
- 核验日期：2026-08-02

## 结论

img2threejs 当前不是“上传多视图后输出完整带骨骼 GLB/GLTF”的传统图像转 3D 服务。它是面向编码代理的技能和质量门控流程：根据参考图生成程序化 TypeScript `THREE.Group` 工厂，通过基础几何、生成几何、材质、层级、枢轴和视觉复核重建对象。

## 已确认能力

- 输入：快速流程目前以单张参考图为主。
- 输出：TypeScript/Three.js 程序化模型，而不是默认 GLB/GLTF 网格资产。
- 主体类型：支持对象、人物和混合主体分类。
- 人物：已经提供 anatomy-aware character track、人体比例、面部标志和姿势流程。
- 运行时：可输出 pivot、socket、collider 和可动画层级。
- 依赖：脚本侧要求 Python 3.10+，主要使用标准库。
- 许可证：Apache-2.0，可在遵守许可证和 NOTICE 要求的前提下使用和修改。

## 关键限制

- 单图不能可靠恢复隐藏背面和精确几何。
- README 明确说明人物属于风格化程序化重建，不保证照片级人物相似度。
- v1.5 Character Update 仍在推进人物重建、绑定就绪拓扑、blendshape、头发和服装。
- 自动绑定、自动蒙皮权重、Mixamo 兼容和面部 rig 位于 v1.8 路线图。
- 多视图重建位于 v2.0 路线图。
- README 的示例输出是代码工厂，不能把它描述成已经输出生产级写实 GLB。

## 本项目策略

1. 当前网站继续使用项目自建的程序化成年女性训练模型占位，只验证播放器、相机、绳路、提示层和课程架构。
2. 课程 Schema 使用独立 `modelAsset` 元数据，避免把课程内容绑定到占位模型。
3. 正式人物资产必须经过：统一多视图参考图、建模或重拓扑、骨骼绑定、权重、姿势校正、穿模检查、GLB 压缩、LOD 和人工审核。
4. img2threejs 可用于比例、材质、程序化部件和角色结构探索，但当前不能替代完整的写实人物资产管线。
5. 任何由 img2threejs 生成的人物都必须单独验证背面、手指、关节位置、网格完整性、法线、面数和绑定可行性。

## 来源

- https://github.com/img2threejs/img2threejs
- 仓库 README，版本 1.4.3
- 仓库 LICENSE，Apache License 2.0
