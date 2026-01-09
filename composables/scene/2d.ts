import { scene2DParams } from "~/data/scene2DParams";
import { Shapes2D } from "../shapes2D";

/** 
 * Class that instanciates the 2D scene
 * includes canvas, ctx
 */
export class Scene2D {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  shapes: any;
  progress = 0;
  private lastInterval: number | undefined;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    // This sets the current 2D scene into state accessible from different components 
    set2DScene(this);
    
    this.shapes = new Shapes2D();
    
    this.resize();
    this.handleEvents();
    this.animate();
  }

  handleEvents() {
    window.addEventListener('resize', (e) => {
      this.resize()
    })
  }

  resize () {
    if (!this.canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    scaleCanvas(this.canvas, this.ctx, width, height);
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.shapes?.update();

    this.progress++;
  }

  initScene = (index: number) => {
    // Remove existing shapes and intervals
    clearInterval(this.lastInterval);
    use3DScene().value?.shapes.removeAll();
    this.shapes.removeAll();

    // Get new scene params
    const params = scene2DParams[index]!;

    setSceneMeta({
      title: params.title,
      act: params.act,
      trackIndex: index
    });

    // console.log('initScene:', params.act, index, params.title );

    // Create shapes
    this.shapes.create(params.type, params );
  }

  stop = () => {
    // Remove existing shapes and intervals
    clearInterval(this.lastInterval);
    this.shapes.removeAll();

    setSceneMeta(null);
  }
}