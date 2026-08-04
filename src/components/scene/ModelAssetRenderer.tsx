import { Html } from '@react-three/drei';
import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from 'react';
import type { ModelAsset } from '../../schemas/course';
import { TrainingMannequin } from './TrainingMannequin';
import './model-asset.css';

const GlbAssetModel = lazy(() => import('./GlbAssetModel'));

interface ModelAssetRendererProps {
  asset: ModelAsset;
  opacity: number;
}

interface ModelAssetBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ModelAssetBoundaryState {
  failed: boolean;
}

class ModelAssetBoundary extends Component<ModelAssetBoundaryProps, ModelAssetBoundaryState> {
  state: ModelAssetBoundaryState = { failed: false };

  static getDerivedStateFromError(): ModelAssetBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void error;
    void info;
    // The visible fallback is intentional; no unreviewed external asset should break the lesson.
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function ModelFallback({ opacity, reason }: { opacity: number; reason: string }) {
  return (
    <>
      <TrainingMannequin opacity={opacity} />
      <Html position={[0, 2.72, 0]} center>
        <div className="model-asset-fallback" role="status">
          <strong>已使用安全占位模型</strong>
          <span>{reason}</span>
        </div>
      </Html>
    </>
  );
}

function isRemoteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export function ModelAssetRenderer({ asset, opacity }: ModelAssetRendererProps) {
  if (asset.kind === 'procedural') {
    return <TrainingMannequin opacity={opacity} />;
  }

  if (isRemoteUrl(asset.url) && !asset.allowRemote) {
    return <ModelFallback opacity={opacity} reason="该课程未授权从外部地址加载模型。" />;
  }

  return (
    <ModelAssetBoundary
      key={`${asset.id}:${asset.sha256 ?? 'unverified'}`}
      fallback={<ModelFallback opacity={opacity} reason="GLB 下载、完整性校验或解析失败，教学绳路仍可继续查看。" />}
    >
      <Suspense fallback={<Html center><div className="scene-loader">按需加载 GLB 模块…</div></Html>}>
        <GlbAssetModel asset={asset} opacity={opacity} />
      </Suspense>
    </ModelAssetBoundary>
  );
}
