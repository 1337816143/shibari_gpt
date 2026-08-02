# Shibari Studio

面向成年学习者的安全优先 3D 绳艺教学网站原型。

> 当前示范课程为 `prototype-only`，不包含承重或吊缚教学。任何课程在独立专业绳艺审核、医学/人体结构审核和模型技术审核完成前，都不得标记为正式课程。

## Phase 4 当前能力

- React 19、TypeScript 6、Vite 8、React Three Fiber；
- 360°相机、推荐视角、镜像、透明度与画质控制；
- Catmull-Rom 可编辑绳路与逐段动画；
- 操作手、绳头方向、接触点、风险点和错误绳路对比；
- 播放、暂停、重播、单步循环、时间轴和多档速度；
- 课程搜索、分类筛选、本地收藏和版本化学习记录；
- Three.js 按需加载、GLB 二次分包和二维降级；
- GLB 体积预算、加载超时、可选 SHA-256、骨骼安全克隆和模型诊断；
- 本地模型资产清单、来源、许可证、哈希和 GLB 容器静态校验；
- 资产来源与课程审核状态透明展示；
- 版本绑定的发布门禁：课程、姿势、模型和三类独立审核必须同时通过；
- 锁定依赖、Vitest、Playwright、只读 GitHub Actions 与 GitHub Pages。

## 默认人物与候选人物

默认课程仍使用项目自制的完整着装成年人程序化训练模型。它用于验证教学交互，不代表最终视觉质量。

仓库包含 Khronos/Cesium `RiggedFigure`，仅用于验证 GLB、骨骼、动画、哈希、诊断和失败回退。它不是正式教学人物。

`tools/blender/` 提供 Blender 4.5 LTS + MPFB + MakeHuman CC0 系统资产的可复现候选生成管线。该管线能够生成成年人女性、完整服装、game-engine rig、四视图预览、GLB 和结构报告，但生成结果必须通过人工视觉、姿势、权重、绳路和移动端性能验收后才能登记为课程资产。

## 本地运行

```bash
npm ci
npm run dev
```

完整校验：

```bash
npm run check
npm run test:e2e
```

其中 `npm run verify:models` 会验证已登记模型的：

- 本地路径与体积预算；
- SHA-256；
- GLB 2.0 容器头、JSON 块、场景和节点；
- `SOURCE.md`、`LICENSE.txt` 与 `SHA256.txt`。

## 生成 MPFB 技术候选

需要可联网的 Linux 环境，并会下载 Blender 和约 267 MB 的 MakeHuman CC0 系统资产：

```bash
BLENDER_VERSION=4.5.12 \
OUTPUT_DIR=/tmp/shibari-mpfb-output \
bash tools/blender/run_candidate_pipeline.sh
```

输出包括：

- `shibari-adult-female-candidate.glb`；
- 正、背、左、右四视图 PNG；
- `candidate-report.json`；
- 来源、许可证和 SHA-256；
- 完整生成日志。

生成成功不等于资产审核通过。

## 部署

仓库配置了 GitHub Pages 工作流，安装方式为 `npm ci`。Pages Source 应设置为 **GitHub Actions**。

## 关键文档

- `docs/architecture.md`
- `docs/model-pipeline/phase4-asset-pipeline.md`
- `docs/model-pipeline/asset-acceptance-checklist.md`
- `docs/model-pipeline/image2-prompts.md`
- `docs/model-pipeline/img2threejs-assessment.md`
- `docs/research/reference-site-analysis.md`
- `docs/research/teaching-research-protocol.md`
