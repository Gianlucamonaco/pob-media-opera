import { SceneElement } from "~/composables/shapes/2d/element";
import { useAudioManager } from "~/composables/audio/manager";
import { scaleCanvas } from "~/composables/utils/canvas";
import type { Scene2DScript } from "~/data/types";
import { scene2DConfig } from "~/data/scene2DConfig";
import { sceneList } from "~/data/sceneList";
import { Layout2DType, Scenes } from "~/data/constants";
import { scene2DScripts } from "../2d/scripts";
import { useSceneBridge } from "../bridge";
import { chance, random, randomInt } from "~/composables/utils/math";

/** 
 * Class that instanciates the 2D scene includes canvas, ctx, elements
 */
export class Scene2D {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  // The Working Canvas (In-Memory Buffer)
  private _workCanvas: OffscreenCanvas;
  private _workCtx: OffscreenCanvasRenderingContext2D;

  // Matrix Configuration
  public matrixRes = { x: 40, y: 20 };
  public matrix: number[] = []; // Linear array of 0s and 1s
  
  // The Tiny Buffer
  private _matrixCanvas: OffscreenCanvas;
  private _matrixCtx: OffscreenCanvasRenderingContext2D;
  private isMatrixMode = false;

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

    // Init working offscreen canvas
    this._workCanvas = new OffscreenCanvas(canvas.width, canvas.height);
    this._workCtx = this._workCanvas.getContext('2d') as any;

      // Initialize the Matrix Buffer
    this._matrixCanvas = new OffscreenCanvas(this.matrixRes.x, this.matrixRes.y);
    this._matrixCtx = this._matrixCanvas.getContext('2d', { willReadFrequently: true }) as any;

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

  setMatrixResolution(x: number, y: number) {
    this.matrixRes = { x, y };
    this._matrixCanvas.width = x;
    this._matrixCanvas.height = y;

    this.matrix = new Array(x * y).fill(0);
  }

  initScene = (index: number) => {
    this.clearAllLogic();

    // Get new scene params
    const scene = sceneList[index];
    const params = scene2DConfig[scene?.title as Scenes];
    if (!scene || !params) return;

    // Detect Matrix Mode from Config
    const matrixConfig = params.elements.find((e: any) => e.layout.type === Layout2DType.MATRIX);
    
    if (matrixConfig) {
      this.isMatrixMode = true;
      this.setMatrixResolution(matrixConfig.layout?.dimensions?.x ?? 40, matrixConfig.layout?.dimensions?.y ?? 20);
    }
    else {
      this.isMatrixMode = false;
    }

    // Create Elements from Config Array
    params.elements.forEach((config: any) => {
      if (config.shape === 'MATRIX') return;

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

    // 1. CLEAR ---
    this._workCtx.clearRect(0, 0, this._width, this._height);

    // 2. UPDATE & DRAW (To Offscreen) ---
    this.elements.forEach(el => el.update());
    this.currentScript?.update?.(this, time);
    this.elements.forEach(el => el.draw());

    // 3. GENERATE MATRIX
    this.updateMatrix();

    // 4. COMPOSITE (To Screen) ---
    this.ctx.clearRect(0, 0, this._width, this._height);
    
    if (this.isMatrixMode) {
      // Draw only the matrix grid to the main screen
      this.updateMatrix();
      this.currentScript?.renderMatrix?.(this, time);
    }
    else {
      // Render the full resolution image
      this.ctx.drawImage(this._workCanvas as any, 0, 0, this._width, this._height);
    }
  }

  stop = () => {
    this.clearAllLogic();
  }

  destroy () {
    cancelAnimationFrame(this._raf);
    this.clearAllLogic();

    window.removeEventListener('resize', this.handleResize);    
  }

  private updateMatrix() {
    // 1. Clear the matrix canvas
    this._matrixCtx.clearRect(0, 0, this.matrixRes.x, this.matrixRes.y);

    // B. Draw the work canvas into the tiny one (GPU Downsampling)
    this._matrixCtx.drawImage(
      this._workCanvas as any, 
      0, 0, this._width, this._height, // Source
      0, 0, this.matrixRes.x, this.matrixRes.y // Destination
    );

    // C. Read the pixels
    const imageData = this._matrixCtx.getImageData(0, 0, this.matrixRes.x, this.matrixRes.y);
    const data = imageData.data;

    // D. Thresholding
    this.matrix = [];
    for (let i = 0; i < data.length; i += 4) {
      // data[i] = R, data[i+1] = G, data[i+2] = B, data[i+3] = Alpha (0-255)
      // Could also check brightness: (R+G+B)/3 > 128      
      const isActive = data[i + 3]! > 50 ? 1 : 0;
      this.matrix.push(isActive);
    }
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