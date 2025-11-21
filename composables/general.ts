import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/Addons.js";

export const use3DScene = () => useState('3d-scene', () => null as unknown as THREE.Scene );

export const set3DScene = (scene: THREE.Scene) => {
  use3DScene().value = scene;
};

export const use3DCamera = () => useState('3d-camera', () => null as unknown as THREE.PerspectiveCamera );

export const set3DCamera = (camera: THREE.PerspectiveCamera) => {
  use3DCamera().value = camera;
};

export const use3DOrbitControls = () => useState('3d-orbitControls', () => null as unknown as OrbitControls );

export const set3DOrbitControls = (orbitControls: OrbitControls) => {
  use3DOrbitControls().value = orbitControls;
};