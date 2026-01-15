import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ElementType, Shapes3D } from "../shapes3D";
import { scene3DParams } from "~/data/scene3DParams";
import { Scenes } from "~/data/constants";

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

    if (!meta?.title) return;

    switch (meta.title) {

      // ACT 1
      case Scenes.MITTERGRIES:
        cameraEvents.ZOOM(0.02)
        break;

      case Scenes.GHOSTSSS:
        // if (this._raf) cameraEvents.ZOOM(Math.sin(this._raf / 20) * 2)
        if (this._raf) cameraEvents.ZOOM(sinCycle(this._raf, 3, 1))
        break;

      case Scenes.ESGIBTBROT:
        // if (this._raf) cameraEvents.ZOOM(Math.sin(this._raf / 20) * 2)
        if (this._raf) cameraEvents.ZOOM(sinCycle(this._raf, 8, 1))
        break;

      case Scenes.SUPERJUST:
        if (this._raf) {
          if (this.controls.getDistance() < 500) cameraEvents.ZOOM(0.05);
          cameraEvents.ROTATE(0, Math.sin(this._raf / 350) * 15, 0);
        }
        break;

      // ACT 2
      case Scenes.DATASET:
        if (this._raf) cameraEvents.ROTATE(this._raf * 0.005, 0, 0);
        break;

      // ACT 3
      case Scenes.LIKENOTHING:
        if (this._raf) cameraEvents.ROTATE(this._raf * 0.015, 0, 0);
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
    // console.log('3d.initScene');
    console.log(`Act: ${params.act}, Track: ${index}, ${params.title} `);

    // Set camera position
    cameraEvents.SET(params.camera.x, params.camera.y, params.camera.z);

    setSceneMeta({
      title: params.title,
      act: params.act,
      trackIndex: index
    });

    // Create shapes
    this.shapes.create(params.type, params.shapes);

    if (params.connections) {
      this.shapes.create(ElementType.CONNECTIONS);
      this.shapes.elements[1].setRef?.(this.shapes.elements[0])
    }

    // Set extra events
    switch (params.title) {

      // All elements are visible
      case Scenes.MITTERGRIES:
      case Scenes.DATASET:
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

          for (let i = 0; i < shapes.rows * shapes.columns; i++) {
            if ((i + prog) % 15 < 9) shapes.setInstanceVisibility(i, true);
          }

          prog++;
        }, 100)
        break;

      // Elements visibility only two elements at a time (interval or input)
      case Scenes.RFBONGOS:
        this.lastInterval = setInterval(() => {
          this.shapes.elements[0]?.setVisibility(false);

          for (let i = 0; i < 2; i++) {
            if (i == 1 && Math.random() > 0.33) return;
            const index = Math.round(this.shapes.elements[0].columns * this.shapes.elements[0].rows * Math.random());
            this.shapes.elements[0].setInstanceVisibility(index, true);          
          }
        }, 250)
        break;

      case Scenes.LIKENOTHING:
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
    use3DScene().value?.shapes.removeAll();
    this.shapes.removeAll();

    // Reset camera position
    cameraEvents.RESET();

    // Clear scene meta
    setSceneMeta(null);
  }

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