# Shibari Studio

面向成年学习者的安全优先 3D 绳艺教学网站原型。

> 当前课程和程序化人物均为 `prototype-only`。不包含承重或吊缚教学，未经专业绳师与医学安全审核，不得作为正式课程发布。

## 当前能力

- React + TypeScript + Vite + React Three Fiber；
- 360°相机、推荐视角、镜像、透明度与画质控制；
- Catmull-Rom 人工可编辑绳路和逐段动画；
- 操作手提示、绳头方向、接触点、风险点和错误绳路对比；
- 播放、暂停、重播、单步循环、时间轴和多档速度；
- 课程 Schema 与 UI/3D 引擎分离；
- 课程搜索、分类筛选、本地收藏和学习记录；
- Three.js 按需加载和二维降级模式；
- Vitest、Playwright、GitHub Actions 与 GitHub Pages。

## 本地运行

```bash
npm install
npm run dev
```

完整校验：

```bash
npm run check
npm run test:e2e
```

## 部署

仓库已配置 GitHub Pages 自定义工作流。Pages Source 应设置为 **GitHub Actions**。

## 重要文档

- `docs/research/reference-site-analysis.md`
- `docs/research/teaching-research-protocol.md`
- `docs/model-pipeline/image2-prompts.md`
- `docs/model-pipeline/img2threejs-assessment.md`
- `docs/architecture.md`
