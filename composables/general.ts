export const useSceneTitle = () => useState('scene-title', () => '-' );

export const setSceneTitle = (scene: string) => {
  useSceneTitle().value = scene;
};

export const use3DScene = () => useState('3d-scene', () => null as any );

export const set3DScene = (scene: any) => {
  use3DScene().value = scene;
};

export const use2DScene = () => useState('2d-scene', () => null as any );

export const set2DScene = (scene: any) => {
  use2DScene().value = scene;
};