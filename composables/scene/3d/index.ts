import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { setSmoothFactor, useAudioManager } from "~/composables/audio/manager";
import { SceneElement } from "~/composables/shapes/3d/element";
import { BASE_BACKGROUND, BASE_FOV, BASE_SMOOTH_FACTOR, Scenes } from "~/data/constants";
import type { Scene3DScript } from "~/data/types";
import { scene3DConfig } from "~/data/scene3DConfig";
import { sceneList } from "~/data/sceneList";
import { CameraController } from "../camera/controller";
import { sceneScripts } from "./scripts";

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
  elements: Map<string, SceneElement> = new Map();
  audioManager = useAudioManager();

  private _raf: number = 0;
  private currentScript: Scene3DScript | null = null;
  private activeIntervals: number[] = [];
  private handleResize = () => this.resize();

  constructor (canvas: HTMLCanvasElement) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BASE_BACKGROUND);

    this.camera = new THREE.PerspectiveCamera( BASE_FOV, width / height, 0.1, 15000 );
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

    window.addEventListener('resize', this.handleResize)

    this.animate();
  }

  // Helper to manage intervals so they are automatically cleaned up
  registerInterval (id: any) {
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

    // Create Elements from Config Array
    params.elements.forEach((config: any) => {
      const element = new SceneElement(config, this.scene, this.camera);
      this.elements.set(config.id, element);
    });
    
    // Dynamic Logic from scene/3d/scripts.ts
    this.currentScript = sceneScripts[scene.title as Scenes] || null;
    this.currentScript?.init?.(this, params);

    // If fov and smooth factor are not explicit, set default
    this.cameraFov(params.fov ?? BASE_FOV);
    this.setBackground(params.background ?? BASE_BACKGROUND)
    setSmoothFactor(params.smoothFactor ?? BASE_SMOOTH_FACTOR)
  }

  update = () => {
    const time = performance.now();

    // Sync reactivity for debug UI component
    setCameraState(this.camera.position.x, this.camera.position.y, this.camera.position.z);

    // 1. Audio: Interpolate values for each frame
    this.audioManager.update();

    // 2. Physics: Move everything naturally
    this.elements.forEach(el => el.updatePhysics());

    // 3. Script: Run Scene-Specific Script Logic
    this.currentScript?.update?.(this, time);

    // 4. Draw
    this.elements.forEach(el => el.draw());
  }

  addInstancesScreenPosition = (id: string, instancesId: number[]) => {
    this.elements.get(id)?.addInstancesScreenPosition(instancesId)
  }

  removeInstancesScreenPosition = (id: string, instancesId: number[]) => {
    this.elements.get(id)?.removeInstancesScreenPosition(instancesId)
  }

  stop = () => {
    this.clearAllLogic();
    this.cameraReset();
  }

  destroy () {
    cancelAnimationFrame(this._raf);
    this.clearAllLogic();

    window.removeEventListener('resize', this.handleResize);    
  }

  setBackground (color: string | number) {
    this.scene.background = new THREE.Color(color);
  }

  // Helper for scripts to find specific elements
  getElement (id: string) {
    return this.elements.get(id);
  }

  private clearAllLogic () {
    this.activeIntervals.forEach(clearInterval);
    this.activeIntervals = [];
    
    // Proper disposal of all elements
    this.currentScript?.dispose?.(this);
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

  cameraLookAt (x: number, y: number, z: number) {
    this.cameraController.lookAt(x, y, z);
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