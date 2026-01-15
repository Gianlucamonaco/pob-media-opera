import { ChannelNames } from "~/data/constants";
import { sceneList } from "~/data/sceneList";
import { useSceneManager } from "../scene/manager";

/** 
 * Keyboard controls
 * - 1-9: set scene title and shapes
 * - 0: clear scene title and shapes
 * - r: rotate view
 */
export class KeyboardControls {
  constructor () {
    this.handleEvents()
  }

  handleEvents () {
    const { initScene2D, initScene3D, exportScene3D, resetScene } = useSceneManager();
    const sceneMeta = useSceneMeta().value;

    window.addEventListener('keyup', (e) => {
      let index;

      switch (e.key) {
        case '-': {
          resetScene()
          break;
        }

        case '0': {
          initScene2D(0);
          break;
        }

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          index = parseInt(e.key) - 1;
          initScene3D(index);
          break;
        }

        case 'd': {
          setDebug(!useDebug().value);
          break;
        }

        case 'r': {
          cameraEvents.ROTATE_90();
          break;
        }

        case 's': {
          exportScene3D();
          break;
        }

        case 'ArrowRight': {
          if (sceneMeta) {
            index = sceneMeta.trackIndex;
            if (index < sceneList.length - 1) initScene3D(index + 1);
          }
          break;
        }

        case 'ArrowLeft': {
          if (sceneMeta) {
            index = sceneMeta.trackIndex;
            if (index > 0) initScene3D(index - 1);
          }
          break;
        }
      }
    })
  }

}