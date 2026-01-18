import { SceneElement } from "~/composables/shapes/2d/element";
import { useAudioManager } from "~/composables/audio/manager";
import { scaleCanvas } from "~/composables/utils/canvas";
import type { Scene2DScript } from "~/data/types";
import { scene2DConfig } from "~/data/scene2DConfig";
import { sceneList } from "~/data/sceneList";
import { Scenes } from "~/data/constants";
import { scene2DScripts } from "../2d/scripts";

/** 
 * Class that instanciates the 2D scene includes canvas, ctx, elements
 */
export class Scene2D {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  elements: Map<string, SceneElement> = new Map();
  audioManager = useAudioManager();
  
  private _raf = 0;
  private currentScript: Scene2DScript | null = null;
  private activeIntervals: number[] = [];
  private handleResize = () => this.resize();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    setScene2D(this);
    
    this.resize();
    window.addEventListener('resize', this.handleResize);
    this.animate();
  }

  resize () {
    if (!this.canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    scaleCanvas(this.canvas, this.ctx, width, height);
  }

  animate = () => {
    this._raf = requestAnimationFrame(this.animate);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.update();
  }

  initScene = (index: number) => {
    this.clearAllLogic();

    // Get new scene params
    const scene = sceneList[index];
    const params = scene2DConfig[scene?.title as Scenes];
    if (!scene || !params) return;

    // Create Elements from Config Array
    params.elements.forEach((config: any) => {
      const element = new SceneElement(config, this.ctx, this.canvas.width, this.canvas.height);
      this.elements.set(config.id, element);
    });

    // Dynamic Logic from scene/3d/scripts.ts
    this.currentScript = scene2DScripts[scene.title as Scenes] || null;
    this.currentScript?.init?.(this, params);
  }

  update = () => {
    const time = performance.now();

    // 1. Update elements data
    this.elements.forEach(el => el.update());

    // 2. Script: Run Scene-Specific Script Logic
    this.currentScript?.update?.(this, time);

    // 3. Draw
    this.elements.forEach(el => el.draw());
  }

  stop = () => {
    this.clearAllLogic();
  }

  destroy () {
    cancelAnimationFrame(this._raf);
    this.clearAllLogic();

    window.removeEventListener('resize', this.handleResize);    
  }

  private clearAllLogic () {
    this.activeIntervals.forEach(clearInterval);
    this.activeIntervals = [];

    // Proper disposal of all elements
    this.elements.forEach(el => el.dispose());
    this.elements.clear();
  }

/* ------------------------------
   Export
   ------------------------------ */

  exportPng = (filename = 'export.png') => {
    const canvas = this.canvas;

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