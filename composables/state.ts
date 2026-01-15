import type { SceneMeta } from "~/data/types";

export const useSceneMeta = () => useState('scene-meta', () => null as SceneMeta | null );

export const setSceneMeta = (meta: SceneMeta | null) => {
  useSceneMeta().value = meta;
};

export const use3DScene = () => useState('3d-scene', () => null as any );

export const set3DScene = (scene: any) => {
  use3DScene().value = scene;
};

export const use2DScene = () => useState('2d-scene', () => null as any );

export const set2DScene = (scene: any) => {
  use2DScene().value = scene;
};

export const useDebug = () => useState('debug-mode', () => true);

export const setDebug = (value: boolean) => {
  useDebug().value = value;
}
