import { OriginModes, Palette, Shape2DType, TextAligns, VerticalAligns } from "~/data/constants";
import type { Element2DConfig, Transform2D } from "~/data/types";
import { Layout2DGenerator } from "./layout";
import { wrapText } from "~/composables/utils/string";

/**
 * Takes the abstract Layout data and renders into the 2D canvas
 */
export class SceneElement {
  id: string;
  config: Element2DConfig;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  data: Transform2D[] = [];
  width: number;
  height: number;

  constructor(config: Element2DConfig, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, width: number, height: number) {
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
    const { shape, style, layout } = this.config;

    const color = style.color || Palette.DARK;
    const thickness = style.thickness || 1;
    const fontFamily = style.fontFamily || 'Instrument Serif';

    let fontSize = 10;
    if (style.fontSize?.px) fontSize = style.fontSize?.px;
    if (style.fontSize?.x) fontSize = style.fontSize?.x * this.width / window.devicePixelRatio;
    if (style.fontSize?.y) fontSize = style.fontSize?.y * this.height / window.devicePixelRatio;

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = thickness;
    this.ctx.fillStyle = color;

    this.data.forEach((item: any) => {
      if (!item.visibility) return;

      const width = item.size?.x ?? this.config.style.size?.x ?? 10;
      const height = item.size?.y ?? this.config.style.size?.y ?? 10;

      this.ctx.save();
      this.ctx.translate(item.position.x, item.position.y);
      this.ctx.rotate(item.rotation);
      this.ctx.scale(item.scale, item.scale);

      // 2. Draw shapes
      if (shape === Shape2DType.RECTANGLE) {
        if (style.originMode === OriginModes.CORNER) {
          this.ctx.strokeRect(0, 0, width, height);
        }
        else {
          this.ctx.strokeRect(-width / 2, -height / 2, width, height);
        }
      }

      else if (shape === Shape2DType.TEXT) {
        this.ctx.font = `${fontSize}px ${fontFamily}`;

        if (style.originMode === OriginModes.CORNER) {
          this.ctx.textAlign = style.textAlign ?? TextAligns.LEFT;
          this.ctx.textBaseline = VerticalAligns.TOP;
        }
        else {
          this.ctx.textAlign = TextAligns.CENTER;
          this.ctx.textBaseline = VerticalAligns.MIDDLE;
        }

        let content = this.config.content?.[0] ?? '';
        if (item.contentOverride) content = item.contentOverride;

        if (style.textWrap) {
          const maxWidth = (style.maxWidth || layout.spacing?.x || 1) * this.width;
          const lineHeight = style.lineHeight || fontSize;
          wrapText(this.ctx, content, 0, 0, maxWidth, lineHeight)
        }
        else {
          this.ctx.fillText(content || '', 0, 0);
        }
      }

      else if (shape === Shape2DType.LINE) {
        const xOff = style.originMode === OriginModes.CENTER ? -width / 2 : 0;
        const yOff = style.originMode === OriginModes.CENTER ? -height / 2 : 0;

        this.ctx.beginPath();
        this.ctx.moveTo(xOff, yOff);
        this.ctx.lineTo(xOff + width, yOff + height);
        this.ctx.stroke();
      }

      this.ctx.restore();
    });

    this.ctx.restore();
  }
  
  dispose() {

  }
}