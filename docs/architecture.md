# 架构说明

## 分层

- `schemas/`：Zod 运行时 Schema，是课程、模型和审核记录进入播放器的边界。
- `data/`：课程配置、模型资产清单和经过登记的候选资产。
- `components/scene/`：人物资产适配、骨骼注册、绳路、教学叠加层、相机和渲染性能。
- `components/ui/`：播放器、课程库、审核透明度、发布门禁、术语表和二维降级图。
- `hooks/`：播放状态机和版本化本地学习记录。
- `scripts/`：模型资产静态校验。
- `tools/blender/`：可复现的 MPFB 成年女性完整着装候选生成管线。
- `docs/`：研究、模型流程、许可证、验收门槛和独立审核规范。

## 课程数据边界

课程 Schema 显式记录：

- 分类、标签、预计时长和学习目标；
- 模型资产类型、许可证、成年人呈现、完整着装和审核状态；
- GLB 来源、许可证地址、加载权限、变换、体积预算、超时和可选 SHA-256；
- 模型语义骨骼映射 `boneMap`；
- 推荐视角、绳路、操作手和绳头方向；
- 接触点、检查点、风险点和错误路径；
- 可选的骨骼局部锚点 `anchorBone`；
- 本步完成检查、停止条件和解除方式；
- 版本绑定的独立审核记录。

播放器不根据文字自动猜测三维路径。世界坐标适用于程序化占位模型；正式带骨骼人物应逐步迁移到审核过的语义骨骼局部坐标。

## 模型资产链路

`ModelAssetRenderer` 统一渲染：

- `procedural`：项目内安全占位训练模型；
- `glb`：具有完整来源、许可、加载预算和变换元数据的 GLB。

GLB 加载顺序：

1. 检查远程加载是否被课程显式允许；
2. 使用 `AbortController` 执行超时控制；
3. 下载前后分别检查字节预算；
4. 已登记哈希时使用 Web Crypto 校验 SHA-256；
5. 通过 Blob URL 交给 glTFLoader；
6. 使用 `SkeletonUtils.clone` 创建独立骨骼实例；
7. 每实例克隆材质，避免透明度污染缓存；
8. 注册实际骨骼和语义骨骼别名；
9. 释放材质、Blob URL 和 GLTF 缓存引用。

模型级错误边界只替换人物：下载、哈希、解析或骨骼问题不会移除步骤、绳路和安全文字。整个 WebGL 场景失败时，外层 `SceneBoundary` 再切换为二维图。

## 骨骼局部教学坐标

`TeachingModelProvider` 保存当前模型的骨骼注册表。模型资产通过：

```ts
boneMap: {
  rightForearm: '实际_GLTF_骨骼名',
  rightHand: '实际_GLTF_骨骼名'
}
```

将课程稳定语义名映射到具体模型骨骼。

绳段、接触点、操作手、方向箭头和错误绳路可以声明：

```ts
anchorBone: 'rightForearm'
```

其坐标随即解释为该骨骼的局部坐标，并通过 R3F portal 成为骨骼子节点。人物姿势变化时，教学图形会随骨骼运动。没有 `anchorBone` 的旧课程继续使用世界坐标。

Schema 会拒绝引用了不存在语义映射的课程。运行时若 GLB 实际缺少目标骨骼，则不显示错误位置的图形，而是显示明确的锚点缺失提示。

## 资产供应链

`src/data/model-assets.json` 是机器可读清单。`npm run verify:models` 验证：

- 路径不能逃逸 `public/`；
- 文件大小不超过预算；
- SHA-256 与清单和 `SHA256.txt` 一致；
- GLB magic、版本、声明长度和 JSON 块有效；
- glTF 2.0、场景和节点存在；
- 来源和许可证文件非空。

Khronos/Cesium `RiggedFigure` 只用于加载器、蒙皮、动画、完整性和回退 QA，不是正式教学人物。

## 正式发布门禁

课程 `reviewStatus: approved` 只有在以下条件全部成立时才能通过 Schema：

- `modelId` 与模型资产 ID 一致；
- 模型资产状态为 `approved`；
- 姿势状态为 `approved`；
- 存在独立审核者；
- 绳艺审核状态为 `approved` 且版本等于当前 `courseVersion`；
- 医学/人体结构审核状态为 `approved` 且版本等于当前 `courseVersion`；
- 模型技术审核状态为 `approved` 且版本等于当前 `modelVersion`；
- 每条批准记录具有审核时间。

版本变化会自动使旧批准失去门禁效力。界面中的发布门禁卡片由同一数据实时计算。

## 性能原则

- 首页不加载 Three.js；悬停进入入口时仅预取代码，确认后才初始化 WebGL。
- GLB 解析器是第二级动态导入。
- React、Three 核心、React Three 和 three-stdlib 分块输出。
- 低性能时自动降低 DPR 和阴影质量。
- 二维分步图完全不依赖 Three.js。
- 生产人物仍需 Meshopt/Draco、WebP/KTX2、LOD 和真机内存测试。

## 学习记录

学习记录键：

`shibari-studio:learning:v1:<courseId>`

只保存收藏、已完成复查的步骤和上次查看位置，不上传服务器，也不把播放完成等同于掌握。
