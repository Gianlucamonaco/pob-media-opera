import { scene2DParams } from "~/data/scene2DParams";
import { scene3DParams } from "~/data/scene3DParams";

/** 
 * Keyboard controls
 * - 1-9: set scene title and shapes
 * - 0: clear scene title and shapes
 * - r: rotate view
 */
export class KeyControls {
  private lastInterval: number | undefined;

  constructor () {
    this.handleEvents()
  }

  handleEvents () {
    const { shapes: shapes3D } = use3DScene().value;

    // Events
    window.addEventListener('keyup', (e) => {
      clearInterval(this.lastInterval)

      if (e.key == '-') {
        cameraEvents.RESET();
        shapes3D.removeAll();
        setSceneTitle('-');
      }
      if (e.key == '0') {
        cameraEvents.RESET();
        shapes3D.removeAll();
        this.initScene2D(0);
      }
      if (e.key == '1') {
        shapes3D.removeAll();
        this.initScene3D(0);

        shapes3D.elements[0].setVisibility(true);
      }
      if (e.key == '2') {
        shapes3D.removeAll();
        this.initScene3D(1);
      }
      if (e.key == '3') {
        shapes3D.removeAll();
        this.initScene3D(2);
        // shapes3D.elements[0].material.uniforms.uThickness.value = Math.random() * 0.04;
      }
      if (e.key == '4') {
        shapes3D.removeAll();
        this.initScene3D(3);

        this.lastInterval = setInterval(() => {
          shapes3D.elements[0].setVisibility(false);

          for (let i = 0; i < 10; i++) {
            const row = Math.round(shapes3D.elements[0].rows * Math.random());
            const col = Math.round(shapes3D.elements[0].columns * Math.random());
            shapes3D.elements[0].setInstanceVisibility(row, col, true);
          }
        }, 500)
      }
      if (e.key == '5') {
        shapes3D.removeAll();
        this.initScene3D(4);
        
        this.lastInterval = setInterval(() => {
          shapes3D.elements[0].setVisibility(false);

          for (let i = 0; i < 2; i++) {
            if (i == 1 && Math.random() > 0.33) return;
            const row = Math.round(shapes3D.elements[0].rows * Math.random());
            const col = Math.round(shapes3D.elements[0].columns * Math.random());
            shapes3D.elements[0].setInstanceVisibility(row, col, true);          
          }
        }, 250)
      }
      if (e.key == 'r') {
        cameraEvents.ROTATE_90();
      }
    })
  }

  initScene2D = (index: number) => {
    const { shapes: shapes2D } = use2DScene().value;

    const params = scene2DParams[index]!;

    setSceneTitle(params.title);
    console.log('initScene:', params.title );

    // Create shapes
    shapes2D.create(params.type, params.content);
  }

  initScene3D = (index: number) => {
    const { shapes: shapes3D } = use3DScene().value;

    const params = scene3DParams[index]!;

    setSceneTitle(params.title);
    console.log('initScene:', params.title );

    // Set camera
    cameraEvents.SET(params.camera.x, params.camera.y, params.camera.z);

    // Create shapes
    shapes3D.create(params.type, params.shapes);
  }
}