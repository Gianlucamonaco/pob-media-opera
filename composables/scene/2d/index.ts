import { SceneElement } from "~/composables/shapes/2d/element";
import { useAudioManager } from "~/composables/audio/manager";
import { scaleCanvas } from "~/composables/utils/canvas";
import type { Scene2DScript } from "~/data/types";
import { scene2DConfig } from "~/data/scene2DConfig";
import { sceneList } from "~/data/sceneList";
import { Scenes } from "~/data/constants";
import { scene2DScripts } from "../2d/scripts";
import { useSceneBridge } from "../bridge";

/** 
 * Class that instanciates the 2D scene includes canvas, ctx, elements
 */
export class Scene2D {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  // The Working Canvas (In-Memory Buffer)
  private _workCanvas: OffscreenCanvas;
  private _workCtx: OffscreenCanvasRenderingContext2D;

  elements: Map<string, SceneElement> = new Map();
  audioManager = useAudioManager();
  
  private _raf = 0;
  private currentScript: Scene2DScript | null = null;
  private activeIntervals: number[] = [];
  private handleResize = () => this.resize();

  // Cached dimensions to avoid DOM reads
  private _width = 0;
  private _height = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    // Fallback to standard canvas if OffscreenCanvas is not supported
    this._workCanvas = new OffscreenCanvas(canvas.width, canvas.height);
    this._workCtx = this._workCanvas.getContext('2d') as any;

    setScene2D(this);
    this.init();
  }
  
  init () {
    this.resize();
    window.addEventListener('resize', this.handleResize);
    this.update();
  }

  resize () {
    if (!this.canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this._width = width;
    this._height = height;

    scaleCanvas(this.canvas, this.ctx, width, height);
    scaleCanvas(this._workCanvas, this._workCtx, width, height);
  }

  initScene = (index: number) => {
    this.clearAllLogic();

    // Get new scene params
    const scene = sceneList[index];
    const params = scene2DConfig[scene?.title as Scenes];
    if (!scene || !params) return;

    // Create Elements from Config Array
    params.elements.forEach((config: any) => {
      const element = new SceneElement(config, this._workCtx, this._width, this._height);
      this.elements.set(config.id, element);
    });

    // Dynamic Logic from scene/3d/scripts.ts
    this.currentScript = scene2DScripts[scene.title as Scenes] || null;
    this.currentScript?.init?.(this, params);
  }

  update = () => {
    this._raf = requestAnimationFrame(this.update);
    const time = performance.now();

    // --- A. CLEAR ---
    this._workCtx.clearRect(0, 0, this._width, this._height);

    // --- B. UPDATE & DRAW (To Offscreen) ---
    this.elements.forEach(el => el.update());
    this.currentScript?.update?.(this, time);
    this.elements.forEach(el => el.draw());

    // --- C. COMPOSITE (To Screen) ---
    this.ctx.clearRect(0, 0, this._width, this._height);
    
    // Draw the entire offscreen buffer as a single image
    this.ctx.drawImage(this._workCanvas, 0, 0, this._width, this._height);
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
    this.currentScript?.dispose?.(this);
    this.elements.forEach(el => el.dispose());
    this.elements.clear();

    useSceneBridge().removeScreenPositions();
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