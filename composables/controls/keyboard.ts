import { sceneList, scenesActOne, scenesActThree, scenesActTwo } from "~/data/sceneList";
import { useSceneManager } from "../scene/manager";
import { useAudioManager } from "../audio/manager";
import { useSceneBridge } from "../scene/bridge";
import { Scenes } from "~/data/constants";

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

      case '0':
        this.manager.initScene(scenesActOne.find(scene => scene.title == Scenes.SISTEMA)?.trackIndex || 0);
        this.audioManager.reset();
        break;

      case '1':
        this.manager.initScene(scenesActOne.find(scene => scene.title == Scenes.SOLO_01)?.trackIndex || 0);
        this.audioManager.reset();
        break;
  
      case '2':
        this.manager.initScene(scenesActOne.find(scene => scene.title == Scenes.SOLO_02)?.trackIndex || 0);
        this.audioManager.reset();
        break;

      case '3': {
        this.manager.initScene(scenesActTwo.find(scene => scene.title == Scenes.SOLO_03)?.trackIndex || 0);
        this.audioManager.reset();
        break;
      }

      case '4': {
        this.manager.initScene(scenesActThree.find(scene => scene.title == Scenes.SOLO_04)?.trackIndex || 0);
        this.audioManager.reset();
        break;
      }

      case '9':
        this.manager.initScene(scenesActThree.find(scene => scene.title == Scenes.STRANGE_ATTRACTOR)?.trackIndex || 0);
        this.audioManager.reset();
        break;

      case '/':
        this.audioManager.reset();
        this.sceneBridge.clearAllScreenPositions();
        break;

      case 'd': {
        setDebug(!useDebug().value);
        break;
      }

      case 'e': {
        this.manager.endScene();
        break;
      }

      case 'r': {
        const angles = this.manager.getCameraAngles();
        if (angles) this.manager.cameraRotate(angles.azimuth + 90, angles.polar);
        break;
      }

      case 's': {
        this.manager.exportScene();
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