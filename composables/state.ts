import type { SceneMeta, Vector3 } from "~/data/types";
import type { Scene3D } from "./scene/3d";
import type { Scene2D } from "./scene/2d";

export const useSceneMeta = () => useState<SceneMeta | null>('scene-meta', () => null);

export const useScene3D = () => useState<Scene3D | null>('3d-scene', () => null);

export const useScene2D = () => useState<Scene2D | null>('2d-scene', () => null);

export const useCameraState = () => useState<Vector3>('camera-telemetry', () => ({
  x: 0,
  y: 0,
  z: 0,
}))

export const useDebug = () => useState<boolean>('debug-mode', () => {
  if (process.client) {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get('debug');
    if (param === 'true') return true;
    if (param === 'false') return false;
  }
  // default if SSR or param not set
  return false;
});

export const setSceneMeta = (meta: SceneMeta | null) => {
  useSceneMeta().value = meta;
};

export const setScene3D = (scene: Scene3D | null) => {
  useScene3D().value = scene;
};

export const setScene2D = (scene: Scene2D | null) => {
  useScene2D().value = scene;
};

export const setCameraState = (x: number, y: number, z: number) => {
  useCameraState().value = { x, y, z };
}

export const setDebug = (value: boolean) => {
  useDebug().value = value;
}

