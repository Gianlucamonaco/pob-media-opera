import { ElementType } from "~/composables/shapes/3d";
import type { Acts, Scenes } from "./constants";
import type { Scene3D } from "~/composables/scene/3d";

export type Vector3 = { x: number; y: number; z: number };
export type Vector2 = { x: number; y: number };

export type SceneMeta = {
  title: Scenes;
  act: Acts;
  trackIndex: number;
  // channelList?: number[];
}

export type ShapeVariation = {
  size: Vector2;
  position: Vector3;
  gap: Vector3;
  rotation: Vector3;
};

export type ShapeMotion = {
  size?: Vector2;
  position?: Vector3;
  gap?: Vector3;
  rotation?: Vector3;
};

export type RectConfig = {
  gridRows?: number;
  gridColumns?: number;
  size?: Vector2;
  gap?: Vector3;
  rotation?: Vector3;
  variation?: ShapeVariation;
  motion?: ShapeMotion;
};

export type CircleConfig = {
  count?: number;
  size?: number;
  thickness?: number;
  depth?: number;
  motion?: number;
};

export type Scene3DConfigItem =
  | { type: ElementType.RECTANGLES; camera: Vector3; shapes: RectConfig; connections?: boolean }
  | { type: ElementType.CIRCLES; camera: Vector3; shapes: CircleConfig; connections?: boolean };

export type Scene3DConfig = {
  [key in Scenes]?: Scene3DConfigItem;
};

export interface SceneScript {
  init?: (scene: Scene3D, params: any) => void;
  update?: (scene: Scene3D, time: number) => void;
  dispose?: (scene: Scene3D) => void;
}

