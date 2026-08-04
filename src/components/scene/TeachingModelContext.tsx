import { createPortal } from '@react-three/fiber';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { Object3D } from 'three';
import { TeachingModelRegistryContext, useTeachingModel } from './teachingModelRegistry';

export function TeachingModelProvider({ children }: { children: ReactNode }) {
  const [root, setRoot] = useState<Object3D | null>(null);
  const [bones, setBones] = useState<ReadonlyMap<string, Object3D>>(new Map<string, Object3D>());
  const [revision, setRevision] = useState(0);

  const registerModel = useCallback((modelRoot: Object3D, boneMap: Readonly<Record<string, string>> = {}) => {
    const byActualName = new Map<string, Object3D>();
    modelRoot.traverse((object) => {
      if (object.type === 'Bone' && object.name) byActualName.set(object.name, object);
    });

    const registry = new Map<string, Object3D>(byActualName);
    Object.entries(boneMap).forEach(([semanticName, actualName]) => {
      const bone = byActualName.get(actualName);
      if (bone) registry.set(semanticName, bone);
    });

    setRoot(modelRoot);
    setBones(registry);
    setRevision((value) => value + 1);

    return () => {
      setRoot((current) => (current === modelRoot ? null : current));
      setBones((current) => (current === registry ? new Map<string, Object3D>() : current));
      setRevision((value) => value + 1);
    };
  }, []);

  const value = useMemo(
    () => ({ revision, root, bones, registerModel }),
    [bones, registerModel, revision, root],
  );

  return <TeachingModelRegistryContext.Provider value={value}>{children}</TeachingModelRegistryContext.Provider>;
}

export function BoneAnchor({ name, children, fallback }: {
  name: string | undefined;
  children: ReactNode;
  fallback: ReactNode;
}) {
  const { bones } = useTeachingModel();
  if (!name) return children;
  const bone = bones.get(name);
  return bone ? createPortal(children, bone) : fallback;
}
