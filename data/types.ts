import * as THREE from 'three';
import type { Acts, ElementType, LayoutType, Scenes, ShapeType } from "./constants";
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
  | { type: ElementType.RECTANGLES; fov?: number, camera: Vector3; shapes: RectConfig; connections?: boolean }
  | { type: ElementType.CIRCLES; fov?: number, camera: Vector3; shapes: CircleConfig; connections?: boolean };

export type Scene3DConfig = {
  [key in Scenes]?: Scene3DConfigItem;
};

export interface SceneScript {
  init?: (scene: Scene3D, params: any) => void;
  update?: (scene: Scene3D, time: number) => void;
  dispose?: (scene: Scene3D) => void;
}

export type RectData = {
  position: { x: number; y: number; z: number; };
  rotation: { x: number; y: number; z: number; };
  size: { x: number; y: number; };
  motion: {
    position: { x: number; y: number; z: number; };
    rotation: { x: number; y: number; z: number; };
  }
}

// This is the "Contract": every layout must produce an array of these
export interface InstanceTransform {
  id: number;

  // Real physics state (persistent)
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;

  // Visual state (resets every frame)
  renderPosition: THREE.Vector3;
  renderRotation: THREE.Euler;
  renderScale: THREE.Vector3;

  motionSpeed?: {
    position: THREE.Vector3;
    rotation: THREE.Vector3;
  }
}

export type SceneConfig = {
  camera: { x: number; y: number; z: number };
  fov?: number;
  elements: ElementConfig[];
};

export interface ElementConfig {
  id: string;
  shape: ShapeType;
  layout: {
    type: LayoutType;
    origin: Vector3;
    dimensions?: Vector3; // For Grid
    count?: number; // For Spiral/Flock
    spacing?: Vector3;
    params?: any; // Layout-specific extra settings
  };
  style: {
    size: Vector2;
    color?: string;
    thickness?: number;
  };
  variation?: {
    position?: Vector3;
    rotation?: Vector3;
    scale?: Vector3;
    speed?: Vector3;
  }
  motion?: {
    position?: Vector3;
    rotation?: Vector3;
  }
}
