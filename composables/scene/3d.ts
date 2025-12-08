import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Shapes3D } from "../shapes3D";
import { scene3DParams, Scenes } from "~/data/scene3DParams";

/** 
 * Class that instanciates the 3D scene
 * includes scene, camera, controls, renderer
 * includes shapes
 */
export class Scene3D {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  shapes: Shapes3D;

  private lastInterval: number | undefined;

  constructor (canvas: HTMLCanvasElement) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#eee");

    this.camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 15000 );
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(width, height);

    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.controls.update();
    this.controls.maxDistance = 1000;

    // This sets the current 3D scene into state accessible from different components 
    set3DScene(this);

    window.addEventListener('resize', () => {
      this.resize();
    })

    // Initialize shapes class (empty)
    this.shapes = new Shapes3D();

    this.animate();
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    this.controls.update();
    this.shapes.update();
    this.update();

    this.renderer.render(this.scene, this.camera);
  }

  resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( width, height );
  }

  update = () => {
    const meta = useSceneMeta().value;

    if (!meta?.title) return;

    switch (meta.title) {
      case Scenes.MITTERGRIES:
        cameraEvents.ZOOM(0.02)
        break;
    }
  }

  initScene = (index: number) => {
    // Remove existing shapes and intervals
    clearInterval(this.lastInterval);
    use2DScene().value?.shapes.removeAll();
    this.shapes.removeAll();

    // Get new scene params
    const params = scene3DParams[index]!;
    console.log('initScene:', params.act, index, params.title );

    setSceneMeta({
      title: params.title,
      act: params.act,
      trackIndex: index
    });

    // Set camera
    cameraEvents.SET(params.camera.x, params.camera.y, params.camera.z);

    // Create shapes
    this.shapes.create(params.type, params.shapes);


    // Set extra events
    switch (params.title) {

      // All elements are visible
      case Scenes.MITTERGRIES:
        this.shapes.elements[0].setVisibility(true);
        break;

      // Different thickness
      case Scenes.GHOSTSSS:
        // this.shapes.elements[0].material.uniforms.uThickness.value = Math.random() * 0.04;
        break;

      // Elements visibility only by column with offset
      case Scenes.SUPERJUST:
        let prog = 0;

        this.lastInterval = setInterval(() => {
          const shapes = this.shapes.elements[0];
          shapes.setVisibility(false);

          for (let r = 0; r < shapes.rows; r++) {
            for (let c = 0; c < 10; c++) {
              const index = shapes.columns * r + c + r + prog;
              shapes.setInstanceVisibility(index, true);
            }
          }

          prog++;
        }, 250)
        break;

      // Elements visibility only two elements at a time (interval or input)
      case Scenes.RFBONGOS:
        this.lastInterval = setInterval(() => {
          this.shapes.elements[0]?.setVisibility(false);

          for (let i = 0; i < 2; i++) {
            if (i == 1 && Math.random() > 0.33) return;
            const row = Math.round(this.shapes.elements[0].rows * Math.random());
            const col = Math.round(this.shapes.elements[0].columns * Math.random());
            this.shapes.elements[0].setInstanceVisibility(row, col, true);          
          }
        }, 250)
        break;
    }
  }

}