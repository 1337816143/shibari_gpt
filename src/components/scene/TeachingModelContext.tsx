import { createPortal } from '@react-three/fiber';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Object3D } from 'three';

interface TeachingModelRegistry {
  revision: number;
  root: Object3D | null;
  bones: ReadonlyMap<string, Object3D>;
  registerModel: (root: Object3D, boneMap?: Readonly<Record<string, string>>) => () => void;
}

const TeachingModelContext = createContext<TeachingModelRegistry | null>(null);

export function TeachingModelProvider({ children }: { children: ReactNode }) {
  const [root, setRoot] = useState<Object3D | null>(null);
  const [bones, setBones] = useState<ReadonlyMap<string, Object3D>>(new Map());
  const [revision, setRevision] = useState(0);

  const registerModel = useCallback((modelRoot: Object3D, boneMap: Readonly<Record<string, string>> = {}) => {
    const byActualName = new Map<string, Object3D>();
    modelRoot.traverse((object) => {
      if (object.type === 'Bone' && object.name) byActualName.set(object.name, object);
    });

    const registry = new Map(byActualName);
    Object.entries(boneMap).forEach(([semanticName, actualName]) => {
      const bone = byActualName.get(actualName);
      if (bone) registry.set(semanticName, bone);
    });

    setRoot(modelRoot);
    setBones(registry);
    setRevision((value) => value + 1);

    return () => {
      setRoot((current) => (current === modelRoot ? null : current));
      setBones((current) => (current === registry ? new Map() : current));
      setRevision((value) => value + 1);
    };
  }, []);

  const value = useMemo(
    () => ({ revision, root, bones, registerModel }),
    [bones, registerModel, revision, root],
  );

  return <TeachingModelContext.Provider value={value}>{children}</TeachingModelContext.Provider>;
}

export function useTeachingModel() {
  const context = useContext(TeachingModelContext);
  if (!context) throw new Error('Teaching model components must be inside TeachingModelProvider');
  return context;
}

export function BoneAnchor({ name, children, fallback = null }: {
  name?: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { bones } = useTeachingModel();
  if (!name) return children;
  const bone = bones.get(name);
  return bone ? createPortal(children, bone) : fallback;
}
