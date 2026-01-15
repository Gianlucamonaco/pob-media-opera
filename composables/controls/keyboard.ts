import { ChannelNames } from "~/data/constants";
import { scene3DParams } from "~/data/scene3DParams";

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
          use2DScene().value?.stop();
          use3DScene().value?.stop();
          break;
        }

        case '0': {
          cameraEvents.RESET();
          use2DScene().value.initScene(0);
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
          use3DScene().value.exportPng();
          break;
        }

        case 'ArrowRight': {
          if (useSceneMeta().value) {
            index = useSceneMeta().value!.trackIndex;
            if (index < scene3DParams.length - 1) {
              use3DScene().value.initScene(index + 1);
            }
          }
          break;
        }

        case 'ArrowLeft': {
          if (useSceneMeta().value) {
            index = useSceneMeta().value!.trackIndex;
            if (index > 0) {
              use3DScene().value.initScene(index - 1);
            }
          }
          break;
        }
      }
    })
  }

}