import { sceneList, scenesActOne, scenesActThree, scenesActTwo } from "~/data/sceneList";
import { useSceneManager } from "../scene/manager";
import { useAudioManager } from "../audio/manager";
import { useSceneBridge } from "../scene/bridge";
import { DEBUG_SCENE } from "~/data/constants";

/** 
 * Keyboard controls
 * - 1-9: set scene title and shapes
 * - 0: clear scene title and shapes
 * - r: rotate view
 */
export class KeyboardControls {
  private manager = useSceneManager();
  private audioManager = useAudioManager();
  private sceneBridge = useSceneBridge();
  private onKeyUp: (e: KeyboardEvent) => void;

  constructor () {
    this.onKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener('keyup', this.onKeyUp);
  }

  destroy() {
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private handleKeyUp (e: KeyboardEvent) {
    const sceneMeta = useSceneMeta().value;

    let index;

    switch (e.key) {
      case '-': {
        this.manager.resetScene()
        break;
      }

      case '1':
        this.manager.initScene(scenesActOne[0]?.trackIndex || 0);
        this.audioManager.reset();
        break;
  
      case '2':
        this.manager.initScene(scenesActTwo[0]?.trackIndex || 0);
        this.audioManager.reset();
        break;

      case '3': {
        this.manager.initScene(scenesActThree[0]?.trackIndex || 0);
        this.audioManager.reset();
        break;
      }

      case '4': {
        this.manager.initScene(sceneList.find(({title}) => title == DEBUG_SCENE)?.trackIndex || 0);
        this.audioManager.reset();
        break;
      }

      case '0':
        this.audioManager.reset();
        this.sceneBridge.removeScreenPositions();
      break;

      case 'd': {
        setDebug(!useDebug().value);
        break;
      }

      case 'r': {
        const angles = this.manager.getCameraAngles();
        if (angles) this.manager.cameraRotate(angles.azimuth + 90, angles.polar);
        break;
      }

      case 's': {
        // TODO: draw 2D and 3D on an offscreen canvas, then download the merge
        this.manager.exportScene3D();
        break;
      }

      case 'ArrowRight': {
        if (sceneMeta) {
          index = sceneMeta.trackIndex;
          if (index < sceneList.length - 1) this.manager.initScene(index + 1);
        }
        break;
      }

      case 'ArrowLeft': {
        if (sceneMeta) {
          index = sceneMeta.trackIndex;
          if (index > 0) this.manager.initScene(index - 1);
        }
        break;
      }
    }
  }

}