import type { Element2DConfig, Transform2D } from "~/data/types";
import { Layout2DType, OriginModes } from "~/data/constants";
import { useSceneBridge } from "~/composables/scene/bridge";

export class Layout2DGenerator {
  static generate(config: Element2DConfig, width: number, height: number): Transform2D[] {
    switch (config.layout.type) {
      case Layout2DType.GRID:
        return this.generateGrid(config, width, height);
      case Layout2DType.SCAN:
        return this.generateScan(config, width, height);
      case Layout2DType.TRACK:
        return this.generateTrack(config, width, height);
      default:
        return [];
    }
  }

  private static generateGrid(config: any, width: number, height: number): Transform2D[] {
    const transforms: Transform2D[] = [];
    const { layout, style } = config;
    const { x: cols, y: rows } = layout.dimensions;
    
    // Calculate cell size based on screen size
    const dpr = window.devicePixelRatio;
    const cellW = width * layout.spacing.x;
    const cellH = height * layout.spacing.y;
    const originX = width * layout.origin.x;
    const originY = height * layout.origin.y;

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
        
        transforms.push(this.createTransform(transforms.length, x, y, style.size?.x, style.size?.y ));
      }
    }
    return transforms;
  }

  private static generateScan(config: any, width: number, height: number): Transform2D[] {
    const transforms: Transform2D[] = [];
    const { layout, style } = config;

    const dpr = window.devicePixelRatio;
    const count = layout.count || 1;
    const x = layout.origin.x * width / dpr;
    const y = layout.origin.y * height / dpr;

    for (let i = 0; i < count; i++) {
      transforms.push(this.createTransform(i, x, y, style.size.x, style.size.y));
    }
    return transforms;
  }

  private static generateTrack(config: any, width: number, height: number): Transform2D[] {
    const { style } = config;
    const { screenPositions } = useSceneBridge();
    const size = { x: style.size.x || 10, y: style.size.y || 10 }

    return Object.values(screenPositions).map((p, i) => ({
      id: i,
      position: { x: p.x * width, y: p.y * height },
      targetPosition: { x: p.x * width, y: p.y * height },
      size,
      targetSize: size,
      rotation: 0,
      scale: p.visible ? 1 : 0, // Hide if behind camera
      visibility: true,
    }));
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