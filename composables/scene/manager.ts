import { useScene2D, useScene3D, setSceneMeta } from "~/composables/state";
import { sceneList } from "~/data/sceneList";

export const useSceneManager = () => {
  const scene2D = useScene2D();
  const scene3D = useScene3D();
  const sceneMeta = useSceneMeta();

  /** Initialize a 2D scene and optionally clear 3D shapes */
  const initScene2D = (index: number) => {
    stopScene3D();

    setSceneMeta(null);
    
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

  /** Initialize a 3D scene (example, can be extended) */
  const initScene3D = (index: number) => {
    const { title, act } = sceneList[index] ?? {};
    if (!title || !act) return;

    stopScene2D();

    setSceneMeta({ title, act, trackIndex: index });
    
    scene3D.value?.initScene(index);

    console.log(`Act: ${act}, Track: ${index}, ${title} `);
  };

  /** Stop/clear 3D scene */
  const stopScene3D = () => {
    scene3D.value?.stop();
  };

  /** Export 3D scene as png */
  const exportScene3D = () => {
    scene3D.value?.exportPng();
  };

  /** Reset all scenes */
  const resetScene = () => {
    stopScene2D();
    stopScene3D();
    setSceneMeta(null);
  };

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
    resetScene,
  };
};
