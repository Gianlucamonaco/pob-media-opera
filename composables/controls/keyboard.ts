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
          cameraEvents.RESET();
          use2DScene().value?.shapes.removeAll();
          use3DScene().value?.shapes.removeAll();
          setSceneMeta(null);
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
        case '5': {
          index = parseInt(e.key) - 1;
          use3DScene().value.initScene(index);
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
      }
    })
  }

}