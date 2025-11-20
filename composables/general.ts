import * as THREE from "three";

export const use3DScene = () => useState('scene', () => null as unknown as THREE.Scene );

export const set3DScene = (scene: any) => {
  use3DScene().value = scene;
};