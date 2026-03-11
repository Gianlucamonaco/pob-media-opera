import type { Element2DConfig, Transform2D } from "~/data/types";
import { Layout2DType, OriginModes } from "~/data/constants";

export class Layout2DGenerator {
  static generate(config: Element2DConfig): Transform2D[] {
    switch (config.layout.type) {
      case Layout2DType.GRID:
        return this.generateGrid(config);
      case Layout2DType.SCAN:
        return this.generateScan(config);
      case Layout2DType.TRACK:
        return this.generateTrack(config);
      default:
        return [];
    }
  }

  private static generateGrid(config: any): Transform2D[] {
    const transforms: Transform2D[] = [];
    const { layout, style } = config;
    const { x: cols, y: rows } = layout.dimensions;
    const w = style.size?.x || 0;
    const h = style.size?.y || 0;
    
    // Calculate cell size based on screen size
    const cellW = layout.spacing.x;
    const cellH = layout.spacing.y;
    const originX = layout.origin.x;
    const originY = layout.origin.y;

    const fullW = cellW * (cols - 1);
    const fullH = cellH * (rows - 1);

    let startX = originX;
    let startY = originY;

    if (style.originMode === OriginModes.CENTER) {
      startX -= fullW / 2;
      startY -= fullH / 2;
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + (c * cellW);
        const y = startY + (r * cellH);
        
        transforms.push(this.createTransform(transforms.length, x, y, w, h ));
      }
    }
    return transforms;
  }

  private static generateScan(config: any): Transform2D[] {
    const transforms: Transform2D[] = [];
    const { layout, style } = config;
    const w = style.size?.x || 0;
    const h = style.size?.y || 0;

    const count = layout.count || 1;
    const x = layout.origin.x;
    const y = layout.origin.y;

    for (let i = 0; i < count; i++) {
      transforms.push(this.createTransform(i, x, y, w, h ));
    }
    return transforms;
  }

  private static generateTrack(config: any): Transform2D[] {
    const transforms: Transform2D[] = [];
    const { layout, style } = config;
    const w = style.size?.x || 0;
    const h = style.size?.x || 0;

    const dpr = window.devicePixelRatio;
    const count = layout.count || 1;
    const x = layout.origin.x;
    const y = layout.origin.y;

    for (let i = 0; i < count; i++) {
      transforms.push(this.createTransform(i, x, y, w, h ));
    }
    return transforms;
  }

  private static createTransform(id: number, x: number, y: number, w: number, h: number): Transform2D {
    return {
      id,
      position: { x, y },
      targetPosition: { x, y },
      size: { x: w, y: h },
      targetSize: { x: w, y: h },
      rotation: 0,
      scale: 1,
      visibility: true,
    };
  }
}