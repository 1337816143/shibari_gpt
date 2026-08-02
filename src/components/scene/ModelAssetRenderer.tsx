import { Html, useGLTF } from '@react-three/drei';
import { Component, useEffect, useMemo, type ErrorInfo, type ReactNode } from 'react';
import type { Material, Mesh } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import type { ModelAsset } from '../../schemas/course';
import { TrainingMannequin } from './TrainingMannequin';
import './model-asset.css';

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

function GlbTrainingModel({ asset, opacity }: { asset: Extract<ModelAsset, { kind: 'glb' }>; opacity: number }) {
  const gltf = useGLTF(asset.url);
  const prepared = useMemo(() => {
    const scene = SkeletonUtils.clone(gltf.scene);
    const materials = new Set<Material>();

    scene.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const clonedMaterials = sourceMaterials.map((source) => {
        const material = source.clone();
        material.opacity = Math.min(material.opacity, opacity);
        material.transparent = material.transparent || opacity < 1;
        material.depthWrite = opacity >= 1;
        materials.add(material);
        return material;
      });
      const firstMaterial = clonedMaterials[0];
      if (!firstMaterial) return;
      mesh.material = Array.isArray(mesh.material) ? clonedMaterials : firstMaterial;
    });

    return { scene, materials };
  }, [gltf.scene, opacity]);

  useEffect(
    () => () => {
      prepared.materials.forEach((material) => material.dispose());
    },
    [prepared],
  );

  return (
    <primitive
      object={prepared.scene}
      position={asset.transform.position}
      rotation={asset.transform.rotation}
      scale={asset.transform.scale}
      dispose={null}
    />
  );
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
      key={asset.id}
      fallback={<ModelFallback opacity={opacity} reason="GLB 加载或解析失败，教学绳路仍可继续查看。" />}
    >
      <GlbTrainingModel asset={asset} opacity={opacity} />
    </ModelAssetBoundary>
  );
}
