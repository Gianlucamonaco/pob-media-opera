import * as THREE from "three";

export const useScene = () => useState('scene', () => null as unknown as THREE.Scene );

export const setScene = (scene: any) => {
  useScene().value = scene;
};