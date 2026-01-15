import { ChannelNames } from "~/data/constants";
import { sceneList } from "~/data/sceneList";

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
    window.addEventListener('keyup', (e) => {
      let index;

      switch (e.key) {
        case '-': {
          useScene2D().value?.stop();
          useScene3D().value?.stop();
          break;
        }

        case '0': {
          cameraEvents.RESET();
          useScene2D().value?.initScene(0);
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
          const { $wsAudio } = useNuxtApp() as any;
          $wsAudio[ChannelNames.MASTER_CTRL].scene = parseInt(e.key);
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
          useScene3D().value?.exportPng();
          break;
        }

        case 'ArrowRight': {
          if (useSceneMeta().value) {
            index = useSceneMeta().value!.trackIndex;
            if (index < sceneList.length - 1) {
              useScene3D().value?.initScene(index + 1);
            }
          }
          break;
        }

        case 'ArrowLeft': {
          if (useSceneMeta().value) {
            index = useSceneMeta().value!.trackIndex;
            if (index > 0) {
              useScene3D().value?.initScene(index - 1);
            }
          }
          break;
        }
      }
    })
  }

}