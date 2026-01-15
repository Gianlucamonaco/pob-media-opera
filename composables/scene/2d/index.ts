import { scene2DParams } from "~/data/scene2DParams";
import { Shapes2D } from "~/composables/shapes/2d";
import { scaleCanvas } from "../../utils/canvas";

/** 
 * Class that instanciates the 2D scene
 * includes canvas, ctx
 */
export class Scene2D {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  shapes: Shapes2D;
  progress = 0;
  
  private _lastInterval = 0;
  private _raf = 0;
  private handleResize = () => this.resize();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    setScene2D(this);
    
    this.shapes = new Shapes2D();
    
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
    this.shapes?.update();

    this.progress++;
  }

  initScene = (index: number) => {
    // Reset scene
    this.progress = 0;
    this.shapes.removeAll();
    clearInterval(this._lastInterval);

    // Get new scene params
    const params = scene2DParams[index];
    if (!params) return;

    // Create new shapes
    this.shapes.create(params.type, params);
  }

  stop = () => {
    this.shapes.removeAll();

    window.removeEventListener('resize', this.handleResize);    
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    clearInterval(this._lastInterval);

    this.shapes.removeAll();
  }

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