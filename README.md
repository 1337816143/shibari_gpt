# Shibari Studio

安全优先的 3D 成人绳艺互动教学网站 PoC。当前版本验证：

- React + TypeScript + Vite + React Three Fiber；
- 程序化成年女性训练模型占位；
- 360°视角、预设视角、缩放、镜像、人物透明度；
- Catmull-Rom 绳路、当前绳段高亮、已完成绳段弱化；
- 分步骤播放器、时间轴、循环和 0.25/0.5/1/1.5 倍速；
- 步骤绑定的安全提示、风险层、检查点和解除说明；
- Zod 课程 Schema、Vitest、Playwright、CI 和 GitHub Pages 工作流。

## 重要状态

本仓库中的示范课程标记为 `prototype-only`，未经过专业绳师和医学安全审核，不可作为正式操作指导。禁止承重和吊缚。

img2threejs 当前并不能直接完成“多视图图片 → 写实、完整、带骨骼 GLB 人物”。技术评估见 `docs/model-pipeline/img2threejs-assessment.md`。

## 本地运行

```bash
npm ci
npm run dev
```

## 校验

```bash
npm run check
npm run test:e2e
```

## 目录

- `src/data`：课程配置
- `src/schemas`：运行时 Schema
- `src/components/scene`：3D 场景
- `src/components/ui`：播放器与说明面板
- `docs/research`：参考网站分析和教学研究协议
- `docs/model-pipeline`：Image 2 与 img2threejs 流程记录

## 部署

Vite base 已设置为 `/shibari_gpt/`。GitHub Actions 在 `main` 和当前 PoC 分支上构建并部署 GitHub Pages。
