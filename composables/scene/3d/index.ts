import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ElementType, Shapes3D } from "~/composables/shapes/3d";
import { scene3DConfig } from "~/data/scene3DConfig";
import { sceneList } from "~/data/sceneList";
import { Scenes } from "~/data/constants";
import { CameraController } from "../camera/controller";

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
  cameraController: CameraController;

  private lastInterval: number | undefined;
  private _raf: number | undefined;

  constructor (canvas: HTMLCanvasElement) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#eee");

    this.camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 15000 );
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);

    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.controls.update();
    this.controls.maxDistance = 1000;

    this.cameraController = new CameraController(this.camera, this.controls);

    // This sets the current 3D scene into state accessible from different components 
    setScene3D(this);

    window.addEventListener('resize', () => {
      this.resize();
    })

    // Initialize shapes class (empty)
    this.shapes = new Shapes3D();

    this.animate();
  }

  animate = () => {
    this._raf = requestAnimationFrame(this.animate);

    this.update();
    this.controls.update();
    this.shapes.update();

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
    
    // Push camera position into reactive state to update Vue
    const pos = this.camera.position;
    setCameraState(pos.x, pos.y, pos.z)

    if (!meta?.title) return;

    switch (meta.title) {

      // ACT 1
      case Scenes.MITTERGRIES:
        this.cameraZoom(0.02)
        break;

      case Scenes.GHOSTSSS:
        // if (this._raf) this.cameraZoom(Math.sin(this._raf / 20) * 2)
        if (this._raf) this.cameraZoom(sinCycle(this._raf, 3, 1))
        break;

      case Scenes.ESGIBTBROT:
        // if (this._raf) this.cameraZoom(Math.sin(this._raf / 20) * 2)
        if (this._raf) this.cameraZoom(sinCycle(this._raf, 8, 1))
        break;

      case Scenes.SUPER_JUST:
        if (this._raf) {
          if (this.controls.getDistance() < 500) this.cameraZoom(0.05);
          this.cameraRotate(0, 90 + Math.sin(this._raf / 350) * 15);
        }
        break;

      // ACT 2
      case Scenes.DATASET:
        if (this._raf) this.cameraRotate(this._raf * 0.005, 90);
        break;

      // ACT 3
      case Scenes.LIKE_NOTHING:
        if (this._raf) this.cameraRotate(this._raf * 0.015, 90);
        break;

    }
  }

  initScene = (index: number) => {
    // Remove existing shapes and intervals
    clearInterval(this.lastInterval);
    this.shapes.removeAll();

    // Get new scene params
    const scene = sceneList[index];
    const params = scene3DConfig[scene?.title as Scenes];
    if (!scene || !params) return;

    // Set camera position
    this.cameraPosition(params.camera.x, params.camera.y, params.camera.z);

    // Create shapes
    this.shapes.create(params.type, params.shapes);

    if (params.connections) {
      this.shapes.create(ElementType.CONNECTIONS);
      this.shapes.elements[1].setRef?.(this.shapes.elements[0])
    }

    // Set extra events
    switch (scene.title) {

      // All elements are visible
      case Scenes.INTRO_01:
      case Scenes.INTRO_02:
      case Scenes.MITTERGRIES:
      case Scenes.DATASET:
        this.shapes.elements[0].setVisibility(true);
        break;

      // Different thickness
      case Scenes.GHOSTSSS:
        // this.shapes.elements[0].material.uniforms.uThickness.value = Math.random() * 0.04;
        break;

      // Elements visibility only by column with offset
      case Scenes.SUPER_JUST:
        let prog = 0;

        this.lastInterval = setInterval(() => {
          const shapes = this.shapes.elements[0];
          shapes.setVisibility(false);

          for (let i = 0; i < shapes.gridRows * shapes.gridColumns; i++) {
            if ((i + prog) % 15 < 9) shapes.setInstanceVisibility(i, true);
          }

          prog++;
        }, 100)
        break;

      case Scenes.RFBONGOS:
        break;

      case Scenes.LIKE_NOTHING:
        this.shapes.elements[0].setVisibility(true);

        this.lastInterval = setInterval(() => {
          this.shapes.elements[1]?.setVisibility(false);

          for (let i = 0; i < 10; i++) {
            const index = Math.round(this.shapes.elements[1].count * Math.random());
            this.shapes.elements[1].setInstanceVisibility(index, true);          
          }
        }, 250)
        break;

    }
  }

  stop = () => {
    // Remove existing shapes and intervals
    clearInterval(this.lastInterval);

    this.shapes.removeAll();

    this.cameraReset();
  }

/* ------------------------------
   Camera
   ------------------------------ */

  cameraZoom (value: number) {
    this.cameraController.zoom(value);
  }

  cameraRotate (x: number, y: number) {
    this.cameraController.rotate(x, y);
  }

  cameraPosition (x: number, y: number, z: number) {
    this.cameraController.setPosition(x, y, z);
  }

  cameraReset () {
    this.cameraController.setPosition(0, 0, 100);
  }

  getCameraPosition () {
    return this.cameraController.getPosition();
  }

  getCameraAngles () {
    return this.cameraController.getOrbitAngles();
  }

/* ------------------------------
   Export
   ------------------------------ */  

  exportPng = (filename = 'export.png') => {
    const canvas = this.renderer.domElement;

    canvas.toBlob((blob: Blob | null) => {
      if (!blob) return;
      
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.download = filename;
      a.href = url;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 'image/png');
  }
}

export const sinCycle = (time: number, every: number = 1, amount: number = 1) => {
  const s = time / 120 * Math.PI * 2; // 1 sec full cycle

  return Math.sin(s / every) * amount;
}