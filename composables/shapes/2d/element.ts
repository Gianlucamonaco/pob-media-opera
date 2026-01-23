import { Shape2DType } from "~/data/constants";
import type { Element2DConfig, Transform2D } from "~/data/types";
import { Layout2DGenerator } from "./layout";

/**
 * Takes the abstract Layout data and renders into the 2D canvas
 */
export class SceneElement {
  id: string;
  config: Element2DConfig;
  ctx: CanvasRenderingContext2D;
  data: Transform2D[] = [];
  width: number;
  height: number;

  constructor(config: Element2DConfig, ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.id = config.id;
    this.config = config;
    this.ctx = ctx;
    this.width = width;
    this.height = height;

    // Initialize the layout
    this.data = Layout2DGenerator.generate(config, width, height);
  }

  // PHASE 1: UPDATE (Runs before script)
  update () {

  }

  // PHASE 3: DRAW (Runs after script)
  draw() {
    const { shape, style, content } = this.config;

    if (!style.color) style.color = '#000000';
    if (!style.thickness) style.thickness = 1;

    let fontSize: number;
    if (style.fontSize?.px) fontSize = style.fontSize?.px;
    if (style.fontSize?.x) fontSize = style.fontSize?.x * this.width / window.devicePixelRatio;
    if (style.fontSize?.y) fontSize = style.fontSize?.y * this.height / window.devicePixelRatio;

    this.ctx.save();
    this.ctx.strokeStyle = style.color;
    this.ctx.lineWidth = style.thickness;
    this.ctx.fillStyle = style.color;

    this.data.forEach((item: any) => {
      if (!item.visibility) return;

      const width = item.size?.x ?? this.config.style.size?.x ?? 10;
      const height = item.size?.y ?? this.config.style.size?.y ?? 10;

      this.ctx.save();
      this.ctx.translate(item.position.x, item.position.y);
      this.ctx.rotate(item.rotation);
      this.ctx.scale(item.scale, item.scale);

      this.ctx.beginPath();

      if (shape === Shape2DType.RECTANGLE) {
        this.ctx.strokeRect(-width / 2, -height / 2, width, height);
      }

      else if (shape === Shape2DType.TEXT && content?.length) {
        content.forEach((text: string, lineIndex: number) => {
          this.ctx.font = `${fontSize}px Instrument Serif`;
          this.ctx.fillText(text || '', 0, (lineIndex + 1) * fontSize);
        })
      }

      else if (shape === Shape2DType.LINE) {
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(width, height);
        this.ctx.stroke();
      }

      this.ctx.restore();
    });
  }
  
  dispose() {

  }
}