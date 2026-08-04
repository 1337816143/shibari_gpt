import { createContext, useContext } from 'react';
import type { Object3D } from 'three';

export interface TeachingModelRegistry {
  revision: number;
  root: Object3D | null;
  bones: ReadonlyMap<string, Object3D>;
  registerModel: (root: Object3D, boneMap?: Readonly<Record<string, string>>) => () => void;
}

export const TeachingModelRegistryContext = createContext<TeachingModelRegistry | null>(null);

export function useTeachingModel() {
  const context = useContext(TeachingModelRegistryContext);
  if (!context) throw new Error('Teaching model components must be inside TeachingModelProvider');
  return context;
}
