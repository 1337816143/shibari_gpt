import { Html, useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import { Bone, Box3, Material, Mesh, Object3D, SkinnedMesh, Vector3 } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import type { ModelAsset } from '../../schemas/course';

export type GlbAsset = Extract<ModelAsset, { kind: 'glb' }>;

interface GlbAssetModelProps {
  asset: GlbAsset;
  opacity: number;
}

interface Diagnostics {
  meshes: number;
  skinnedMeshes: number;
  bones: number;
  triangles: number;
  materials: number;
  size: [number, number, number];
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function digestSha256(buffer: ArrayBuffer) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('当前浏览器无法执行模型完整性校验。');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function inspectModel(scene: Object3D): Diagnostics {
  let meshes = 0;
  let skinnedMeshes = 0;
  let bones = 0;
  let triangles = 0;
  const materials = new Set<Material>();

  scene.traverse((object) => {
    if (object instanceof Bone) bones += 1;
    if (!(object instanceof Mesh)) return;

    meshes += 1;
    if (object instanceof SkinnedMesh) skinnedMeshes += 1;
    const position = object.geometry.getAttribute('position');
    triangles += object.geometry.index
      ? Math.floor(object.geometry.index.count / 3)
      : Math.floor((position?.count ?? 0) / 3);

    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
    meshMaterials.forEach((material) => materials.add(material));
  });

  const sizeVector = new Box3().setFromObject(scene).getSize(new Vector3());
  return {
    meshes,
    skinnedMeshes,
    bones,
    triangles,
    materials: materials.size,
    size: [sizeVector.x, sizeVector.y, sizeVector.z],
  };
}

function LoadedGlb({ asset, opacity, blobUrl, byteLength }: GlbAssetModelProps & { blobUrl: string; byteLength: number }) {
  const gltf = useGLTF(blobUrl);
  const prepared = useMemo(() => {
    const scene = SkeletonUtils.clone(gltf.scene);
    const materials = new Set<Material>();

    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;

      const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
      const clonedMaterials = sourceMaterials.map((source) => {
        const material = source.clone();
        material.opacity = Math.min(material.opacity, opacity);
        material.transparent = material.transparent || opacity < 1;
        material.depthWrite = opacity >= 1;
        materials.add(material);
        return material;
      });
      const firstMaterial = clonedMaterials[0];
      if (firstMaterial) object.material = Array.isArray(object.material) ? clonedMaterials : firstMaterial;
    });

    scene.position.set(...asset.transform.position);
    scene.rotation.set(...asset.transform.rotation);
    scene.scale.set(...asset.transform.scale);
    scene.updateMatrixWorld(true);

    return { scene, materials, diagnostics: inspectModel(scene) };
  }, [asset.transform.position, asset.transform.rotation, asset.transform.scale, gltf.scene, opacity]);

  const { actions } = useAnimations(gltf.animations, prepared.scene);

  useEffect(() => {
    if (!asset.animationClip) return undefined;
    const action = actions[asset.animationClip];
    action?.reset().play();
    return () => action?.stop();
  }, [actions, asset.animationClip]);

  useEffect(
    () => () => prepared.materials.forEach((material) => material.dispose()),
    [prepared.materials],
  );

  useEffect(
    () => () => useGLTF.clear(blobUrl),
    [blobUrl],
  );

  const { diagnostics } = prepared;

  return (
    <>
      <primitive object={prepared.scene} dispose={null} />
      <Html position={[0, 2.78, 0]} center distanceFactor={8}>
        <details className="model-diagnostics">
          <summary>模型诊断 · {formatBytes(byteLength)}</summary>
          <dl>
            <div><dt>网格</dt><dd>{diagnostics.meshes}</dd></div>
            <div><dt>蒙皮网格</dt><dd>{diagnostics.skinnedMeshes}</dd></div>
            <div><dt>骨骼</dt><dd>{diagnostics.bones}</dd></div>
            <div><dt>三角面</dt><dd>{diagnostics.triangles.toLocaleString()}</dd></div>
            <div><dt>材质</dt><dd>{diagnostics.materials}</dd></div>
            <div><dt>尺寸</dt><dd>{diagnostics.size.map((value) => value.toFixed(2)).join(' × ')}</dd></div>
          </dl>
        </details>
      </Html>
    </>
  );
}

export default function GlbAssetModel({ asset, opacity }: GlbAssetModelProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [byteLength, setByteLength] = useState(0);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort('timeout'), asset.timeoutMs);
    let objectUrl: string | null = null;

    const load = async () => {
      try {
        setLoadError(null);
        setBlobUrl(null);
        const response = await fetch(asset.url, { signal: controller.signal, credentials: 'omit' });
        if (!response.ok) throw new Error(`模型请求失败：HTTP ${response.status}`);

        const declaredLength = Number(response.headers.get('content-length') ?? 0);
        if (declaredLength > asset.maxBytes) {
          throw new Error(`模型文件超过 ${formatBytes(asset.maxBytes)} 的课程预算。`);
        }

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > asset.maxBytes) {
          throw new Error(`模型文件超过 ${formatBytes(asset.maxBytes)} 的课程预算。`);
        }

        if (asset.sha256) {
          const actualHash = await digestSha256(buffer);
          if (actualHash.toLowerCase() !== asset.sha256.toLowerCase()) {
            throw new Error('模型 SHA-256 与资产清单不一致，已拒绝加载。');
          }
        }

        objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'model/gltf-binary' }));
        setByteLength(buffer.byteLength);
        setBlobUrl(objectUrl);
      } catch (error) {
        if (controller.signal.aborted) {
          setLoadError(new Error(`模型加载超过 ${Math.round(asset.timeoutMs / 1000)} 秒，已中止。`));
          return;
        }
        setLoadError(error instanceof Error ? error : new Error('模型加载失败。'));
      } finally {
        window.clearTimeout(timer);
      }
    };

    void load();

    return () => {
      controller.abort('unmount');
      window.clearTimeout(timer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [asset.maxBytes, asset.sha256, asset.timeoutMs, asset.url]);

  if (loadError) throw loadError;
  if (!blobUrl) {
    return <Html center><div className="scene-loader">校验并加载人物模型…</div></Html>;
  }

  return <LoadedGlb asset={asset} opacity={opacity} blobUrl={blobUrl} byteLength={byteLength} />;
}
