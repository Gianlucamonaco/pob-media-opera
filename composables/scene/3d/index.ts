import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { scene3DConfig } from "~/data/scene3DConfig";
import { sceneList } from "~/data/sceneList";
import { Scenes } from "~/data/constants";
import type { SceneScript } from "~/data/types";
import { CameraController } from "../camera/controller";
import { sceneScripts } from "./scripts";
import { SceneElement } from "~/composables/shapes/3d/element";

/** 
 * Class that instanciates the 3D scene
 * includes scene, camera, controls, renderer, elements
 */
export class Scene3D {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  cameraController: CameraController;
  fov: number = 60;
  elements: Map<string, SceneElement> = new Map();

  private lastInterval: number | undefined;
  private _raf: number | undefined;
  private currentScript: SceneScript | null = null;
  private activeIntervals: number[] = [];

  constructor (canvas: HTMLCanvasElement) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#eee");

    this.camera = new THREE.PerspectiveCamera( this.fov, width / height, 0.1, 15000 );
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

    this.animate();
  }

  // Helper to manage intervals so they are automatically cleaned up
  registerInterval(id: any) {
    this.activeIntervals.push(id);
  }

  animate = () => {
    this._raf = requestAnimationFrame(this.animate);

    this.update();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( width, height );
  }

  initScene = (index: number) => {
    this.clearAllLogic();

    // Get new scene params
    const scene = sceneList[index];
    const params = scene3DConfig[scene?.title as Scenes];
    if (!scene || !params) return;

    // Static Setup from data/scene3DConfig
    this.cameraPosition(params.camera.x, params.camera.y, params.camera.z);
    this.cameraFov(params.fov ?? this.fov);

    // 2. Create Elements from Config Array
    params.elements.forEach((config: any) => {
      const element = new SceneElement(config, this.scene);
      this.elements.set(config.id, element);
    });
    
    // Dynamic Logic from scene/3d/scripts.ts
    this.currentScript = sceneScripts[scene.title as Scenes] || null;
    this.currentScript?.init?.(this, params);
  }

  update = () => {
    const time = performance.now();

    // Sync reactivity for debug UI component
    setCameraState(this.camera.position.x, this.camera.position.y, this.camera.position.z);

    // 1. PHYSICS: Move everything naturally
    this.elements.forEach(el => el.updatePhysics());

    // 2. SCRIPT: Run Scene-Specific Script Logic
    this.currentScript?.update?.(this, time);

    // 3. Commit to GPU
    this.elements.forEach(el => el.draw());
  }

  stop = () => {
    this.clearAllLogic();
    this.cameraReset();
  }

  // Helper for scripts to find specific elements
  getElement(id: string) {
    return this.elements.get(id);
  }

  private clearAllLogic() {
    this.activeIntervals.forEach(clearInterval);
    this.activeIntervals = [];
    this.currentScript?.dispose?.(this);

    // Proper disposal of all elements
    this.elements.forEach(el => el.dispose(this.scene));
    this.elements.clear();
  }

/* ------------------------------
   Camera
   ------------------------------ */

  cameraFov (value: number) {
    this.cameraController.setFov(value);
  }

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