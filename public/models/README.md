# Local model assets

本目录存放经过来源、许可证和机器校验的本地 GLB。进入目录不等于获得正式课程批准。

## 当前结构

```text
public/models/
├── mpfb-casual-mobile/
│   ├── model.glb
│   ├── preview-{front,back,left,right}.png
│   ├── SOURCE.md
│   ├── LICENSE.txt
│   ├── SHA256.txt
│   ├── candidate-report.json
│   ├── glb-audit.json
│   └── catalog-entry.json
├── mpfb-casual-original/
├── mpfb-sports-original/
├── rigged-figure-qa/
└── mpfb-catalog-summary.json
```

三套 MPFB 模型由同一可复现管线生成：

- `mpfb-casual-mobile`：休闲装移动优化版，12 MiB / 1024 贴图硬预算；
- `mpfb-casual-original`：休闲装原始质量版；
- `mpfb-sports-original`：运动装原始质量版，腹部露出并在页面明确标注；
- `rigged-figure-qa`：Khronos/Cesium 技术 QA 示例，不是写实课程人物。

`src/data/model-assets.json` 是浏览器资产清单。所有本地模型必须登记：

- 部署路径与实际体积；
- 来源、许可证和署名；
- 成年人呈现与着装类型；
- SHA-256；
- 加载超时和体积预算；
- 语义骨骼映射；
- 候选预览、用途、警告和质量层级。

禁止提交来源不明、再分发条款不清楚或私有市场授权不允许公开托管的模型。浏览器成功显示只证明加载链路工作，不证明解剖、权重、姿势、绳路或医学安全已经批准。
