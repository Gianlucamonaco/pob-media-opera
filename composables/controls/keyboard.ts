import { sceneList } from "~/data/sceneList";
import { useSceneManager } from "../scene/manager";
import { useAudioManager } from "../audio/manager";

/** 
 * Keyboard controls
 * - 1-9: set scene title and shapes
 * - 0: clear scene title and shapes
 * - r: rotate view
 */
export class KeyboardControls {
  private manager = useSceneManager();
  private audioManager = useAudioManager();
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

      case '0': {
        this.manager.initScene2D(0);
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
        this.manager.initScene3D(index);
        this.audioManager.reset();
        break;
      }

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
        this.manager.exportScene3D();
        break;
      }

      case 'ArrowRight': {
        if (sceneMeta) {
          index = sceneMeta.trackIndex;
          if (index < sceneList.length - 1) this.manager.initScene3D(index + 1);
        }
        break;
      }

      case 'ArrowLeft': {
        if (sceneMeta) {
          index = sceneMeta.trackIndex;
          if (index > 0) this.manager.initScene3D(index - 1);
        }
        break;
      }
    }
  }

}