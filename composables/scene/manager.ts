import { useScene2D, useScene3D, setSceneMeta } from "~/composables/state";
import { sceneList } from "~/data/sceneList";

export const useSceneManager = () => {
  const scene2D = useScene2D();
  const scene3D = useScene3D();
  const sceneMeta = useSceneMeta();

  /** Initialize a 2D scene */
  const initScene2D = (index: number) => {
    scene2D.value?.initScene(index);
  };

  /** Stop/clear 2D scene */
  const stopScene2D = () => {
    scene2D.value?.stop();
  };

  /** Export 2D scene as png */
  const exportScene2D = () => {
    scene2D.value?.exportPng();
  };

  /** Initialize a 3D scene */
  const initScene3D = (index: number) => {
    scene3D.value?.initScene(index);
  };

  /** Stop/clear 3D scene */
  const stopScene3D = () => {
    scene3D.value?.stop();
  };

  /** Export 3D scene as png */
  const exportScene3D = () => {
    scene3D.value?.exportPng();
  };

  /** Init 2D and 3D scenes */
  const initScene = (index: number) => {
    const { title, act } = sceneList[index] ?? {};
    if (!title || !act) return;

    initScene2D(index);
    initScene3D(index);
    setSceneMeta({ title, act, trackIndex: index });

    console.log(`Act: ${act}, Track: ${index}, ${title} `);
  }

  /** Reset 2D and 3D scenes */
  const resetScene = () => {
    stopScene2D();
    stopScene3D();
    setSceneMeta(null);
  };

  const destroy = () => {
    scene2D.value?.destroy();
    scene3D.value?.destroy()
  }

  /** Rotate 3D camera horizontally and vertically (in degrees)
   *  - x: horizontal angle from 0 (front) to 180 (back) to 360 (front) counterclockwise
   *  - y: vertical angle from 0 (top), 90 (horizon) to 180 (bottom)
  */
  const cameraRotate = (x: number, y: number) => {
    scene3D.value?.cameraRotate(x, y);
  }

  /** Reset 3D camera position (0, 0, 100) */
  const cameraReset = () => {
    scene3D.value?.cameraReset();
  }

  /** Get current 3D camera position */
  const getCameraPosition = () => {
    return scene3D.value?.getCameraPosition();
  }

  /** Get current 3D camera spherical angles */
  const getCameraAngles = () => {
    return scene3D.value?.getCameraAngles();
  }

  return {
    scene2D,
    scene3D,
    sceneMeta,
    initScene2D,
    stopScene2D,
    exportScene2D,
    initScene3D,
    stopScene3D,
    exportScene3D,
    initScene,
    resetScene,
    cameraRotate,
    cameraReset,
    getCameraPosition,
    getCameraAngles,
    destroy,
  };
};
