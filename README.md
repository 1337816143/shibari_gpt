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
- 安全确认前不下载 Three.js、场景代码或人物 GLB；
- GLB 受控下载、加载超时、体积预算、SHA-256、骨骼安全克隆和模型诊断；
- 程序化模型、二维分步图和模型级错误回退；
- 本地模型资产清单、来源、许可证、哈希、骨骼映射和 GLB 容器静态校验；
- MPFB 三候选模型目录与可视化选择器；
- 版本绑定的发布门禁：课程、姿势、模型和三类独立审核必须同时通过；
- 锁定依赖、Vitest、Playwright、GitHub Actions 与 GitHub Pages 精确 SHA 发布验收。

## 可选人物模型

页面默认选中适合网页交付的休闲装移动版，但所有候选均保留供比较：

| 选项 | 体积 | 贴图上限 | 呈现 | 用途 |
| --- | ---: | ---: | --- | --- |
| MPFB 休闲装移动版 | 约 11.6 MiB | 1024 | 短袖上衣、长裤、鞋履 | 默认技术候选 |
| MPFB 休闲装原始质量 | 约 24.2 MiB | 4096 | 短袖上衣、长裤、鞋履 | 检查原始材质细节 |
| MPFB 运动装原始质量 | 约 17.7 MiB | 2048 | 短款运动上衣、长裤、鞋履，腹部露出 | 按产品所有者要求保留，用于比较体型和绳路可见性 |
| Khronos RiggedFigure | 约 49 KiB | 示例资产 | 技术 QA | 验证骨骼、动画、哈希和回退 |
| 程序化训练人台 | 无下载 | 无贴图 | 工程占位 | 最低成本回退 |

三套 MPFB 模型均由 Blender 4.5 LTS、MPFB 和 MakeHuman CC0 系统资产可复现生成，具有 game-engine rig、四视图、来源、许可证、SHA-256 和独立 GLB 审计报告。它们全部保持 `technical-review`，没有被伪装为正式课程资产。

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

其中 `npm run verify:models` 会验证：

- 本地路径、实际体积和候选层级预算；
- SHA-256 与清单记录；
- GLB 2.0 容器、场景、节点、网格和蒙皮；
- `boneMap` 中每个实际骨骼是否存在；
- 预览图、`SOURCE.md`、`LICENSE.txt` 与 `SHA256.txt`；
- MPFB 候选报告、GLB 审计和目录摘要是否一致；
- 移动版是否继续满足 12 MiB 与 1024 贴图上限。

## 生成 MPFB 候选目录

需要可联网的 Linux 环境，并会下载 Blender 和约 267 MB 的 MakeHuman CC0 系统资产：

```bash
BLENDER_VERSION=4.5.12 \
OUTPUT_DIR=/tmp/shibari-mpfb-output \
bash tools/blender/run_candidate_pipeline.sh
```

输出目录 `catalog/` 包含三套候选，每套包括：

- `model.glb`；
- 正、背、左、右四视图 PNG；
- `candidate-report.json`；
- `glb-audit.json`；
- `catalog-entry.json`；
- `SOURCE.md`、`LICENSE.txt` 和 `SHA256.txt`。

带 `[mpfb-catalog]` 标记的开发分支 push 会在常规 CI 通过后生成目录，并由 GitHub Actions 将审核产物写回同一分支。普通提交不会重复下载 Blender 或模型资产。

## 部署

仓库配置了 GitHub Pages 工作流。生产链路只部署已经通过开发 CI 的精确提交 SHA，并在公网再次校验页面、静态资源、模型哈希和部署指纹。

## 关键文档

- `docs/architecture.md`
- `docs/completion-status.md`
- `docs/model-pipeline/phase4-asset-pipeline.md`
- `docs/model-pipeline/asset-acceptance-checklist.md`
- `docs/model-pipeline/candidate-catalog.md`
- `docs/model-pipeline/image2-prompts.md`
- `docs/model-pipeline/img2threejs-assessment.md`
- `docs/research/reference-site-analysis.md`
- `docs/research/teaching-research-protocol.md`
