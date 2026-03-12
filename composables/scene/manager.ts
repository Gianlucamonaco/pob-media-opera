import { useScene2D, useScene3D, setSceneMeta, setSceneState, useSceneState } from "~/composables/state";
import { sceneList } from "~/data/sceneList";
import { useSceneBridge } from "./bridge";

export const useSceneManager = () => {
  const scene2D = useScene2D();
  const scene3D = useScene3D();
  const sceneMeta = useSceneMeta();
  const bridge = useSceneBridge();

  const offscreen = document.createElement("canvas");
  offscreen.width  = window.innerWidth * devicePixelRatio;
  offscreen.height = window.innerHeight * devicePixelRatio;

  /** Initialize a 2D scene */
  const initScene2D = (index: number) => {
    scene2D.value?.initScene(index);
  };

  /** End 2D scene */
  const endScene2D = () => {
    scene2D.value?.endScene();
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

  /** End 3D scene */
  const endScene3D = () => {
    scene3D.value?.endScene();
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

    bridge.clearAllScreenPositions();
    initScene2D(index);
    initScene3D(index);
    setSceneMeta({ title, act, trackIndex: index });
    setSceneState({ playing: true, ended: false });

    console.log(`Act: ${act}, Track: ${index}, ${title} `);
  }

  /** End 2D and 3D scenes, without element disposal */
  const endScene = () => {
    const { ended, playing } = useSceneState().value;
    if (!playing || ended) return;

    endScene2D();
    endScene3D();
    setSceneState({ playing: true, ended: true });

    console.log(`Scene ended.`);
  }

  /** Reset 2D and 3D scenes */
  const resetScene = () => {
    bridge.clearAllScreenPositions();
    stopScene2D();
    stopScene3D();
    setSceneMeta(null);
    setSceneState({ playing: false, ended: false });
  };

  /** Draw 2D and 3D on an offscreen canvas, then download the merge */
  const exportScene = () => {
    const ctx = offscreen.getContext('2d');
    if (!ctx || !scene2D.value?.getTexture() || !scene3D.value?.getTexture()) return;

    ctx.drawImage(scene3D.value?.getTexture(), 0, 0, offscreen.width, offscreen.height);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(scene2D.value?.getTexture(), 0, 0, offscreen.width, offscreen.height);

    offscreen.toBlob((blob: Blob | null) => {
      if (!blob) return;
      
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.download = 'pob-export';
      a.href = url;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const destroy = () => {
    bridge.clearAllScreenPositions();
    scene2D.value?.destroy();
    scene3D.value?.destroy();
    setSceneMeta(null);
    setSceneState({ playing: false, ended: false });
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
    endScene,
    resetScene,
    exportScene,
    cameraRotate,
    cameraReset,
    getCameraPosition,
    getCameraAngles,
    destroy,
  };
};
