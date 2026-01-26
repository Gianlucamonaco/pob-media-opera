import * as THREE from 'three';
import type { Scene3D } from "~/composables/scene/3d";
import type { Scene2D } from '~/composables/scene/2d';
import type { Acts, Layout2DType, LayoutType, OriginModes, Palette, Scenes, Shape2DType, ShapeType, TextAligns } from "./constants";

export type Vector3 = { x: number; y: number; z: number };
export type Vector2 = { x: number; y: number };

export type SceneMeta = {
  title: Scenes;
  act: Acts;
  trackIndex: number;
}

export interface Scene2DScript {
  init?: (scene: Scene2D, params: any) => void;
  update?: (scene: Scene2D, time: number) => void;
  dispose?: (scene: Scene2D) => void;
  renderMatrix?: (scene: Scene2D, time: number) => void;
}

export interface Scene3DScript {
  init?: (scene: Scene3D, params: any) => void;
  update?: (scene: Scene3D, time: number) => void;
  dispose?: (scene: Scene3D) => void;
}

// This is the "Contract": every layout must produce an array of these
export interface InstanceTransform {
  id: number;
  params?: any; // Scene-specific extra settings 

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
    scale: THREE.Vector3;
    radial?: number;
  }
}

export interface Transform2D {
  id: number;
  position: { x: number; y: number }; // Start point for lines, Center for rects/text
  targetPosition: { x: number; y: number }; 
  size: { x: number; y: number }; // Delta for lines, W/H for rects
  targetSize: { x: number; y: number };
  rotation: number;
  scale: number;
  visibility: boolean;
  contentOverride?: string;
}

export type SceneConfig = {
  camera: { x: number; y: number; z: number };
  fov?: number;
  background?: string;
  smoothFactor?: number;
  elements: ElementConfig[];
};

export type Scene2DConfig = {
  smoothFactor?: number;
  elements: Element2DConfig[];
}

export interface ElementConfig {
  id: string;
  shape: ShapeType;
  layout: {
    type: LayoutType;
    origin: Vector3;
    rotation?: Vector3;
    dimensions?: Vector3; // For Grid
    spacing?: Vector3; // For Grid
    count?: number; // For Spiral / Sphere / Flock
    radius?: number; // For Spiral / Sphere
    pitch?: number; // For Spiral
    verticalStep?: number; // For Spiral
    params?: any; // Layout-specific extra settings
  };
  style: {
    size: Vector2;
    rotation?: Vector3;
    color?: number | string;
    thickness?: number;
  };
  variation?: {
    position?: Vector3;
    rotation?: Vector3;
    scale?: Vector3;
    speed?: Vector3;
    radial?: number;
  };
  motion?: {
    position?: Vector3;
    rotation?: Vector3;
    scale?: Vector3;
    radial?: number;
  };
  groupMotion?: {
    position?: Vector3;
    rotation?: Vector3;
    scale?: Vector3;
  };
}

export interface Element2DConfig {
  id: string;
  shape: Shape2DType;
  layout: {
    type: Layout2DType;
    origin?: Vector2; // For Grid
    dimensions?: Vector2; // For Grid
    spacing?: Vector2; // For Grid
    count?: number; // For Scan / Track
    params?: any; // Layout-specific extra settings
  };
  style: {
    size?: Vector2; // For Rectangle
    color?: string;
    thickness?: number;
    fontFamily?: string; // For Text
    fontSize?: { x?: number, y?: number, px?: number }; // For Text
    lineHeight?: number; // For Text
    originMode?: OriginModes;
    textAlign?: TextAligns; // For Text
    textWrap?: boolean; // For Text, enable text wrap
    maxWidth?: number; // For Text, wrapping limit
    background?: string; // For Text, solid labels
  };
  motion?: {
    position?: Vector2;
  };
  content?: string[],
}

export interface ProjectedPoint {
  x: number;
  y: number;
  visible: boolean;
  distance?: number;
  ratio?: number;
  left: number;
  top: number;
}