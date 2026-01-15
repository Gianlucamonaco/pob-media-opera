import type { ElementType } from "~/composables/shapes3D";
import type { Acts, Scenes } from "./constants";

export type Vector3 = { x: number; y: number; z: number };
export type Vector2 = { x: number; y: number };

export type SceneMeta = {
  title: Scenes;
  act: Acts;
  trackIndex: number;
  // channelList?: number[];
}

export type ShapeRange = {
  size: Vector2;
  position: Vector3;
  gap: Vector3;
  rotation: Vector3;
};

export type ShapeSpeed = {
  position: Vector3;
  rotation: Vector3;
};

export type RectConfig = {
  rows?: number;
  columns?: number;
  size?: Vector2;
  gap?: Vector3;
  rotation?: Vector3;
  range?: ShapeRange;
  speed?: ShapeSpeed;
};

export type CircleConfig = {
  count?: number;
  size?: number;
  thickness?: number;
  depth?: number;
  speed?: number;
};

export type Scene3DConfigItem = {
  camera: Vector3;
  type: ElementType;
  shapes?: RectConfig | CircleConfig;
  connections?: boolean;
};

export type Scene3DConfig = {
  [key in Scenes]?: Scene3DConfigItem;
};