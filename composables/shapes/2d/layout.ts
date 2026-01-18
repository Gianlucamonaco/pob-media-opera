import type { Element2DConfig, Transform2D } from "~/data/types";
import { Layout2DType } from "~/data/constants";
import { useSceneBridge } from "~/composables/scene/bridge";

export class Layout2DGenerator {
  static generate(config: Element2DConfig["layout"], width: number, height: number): Transform2D[] {
    switch (config.type) {
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

  private static generateGrid(layout: any, width: number, height: number): Transform2D[] {
    const transforms: Transform2D[] = [];
    const { x: cols, y: rows } = layout.dimensions;
    const { x: gapX, y: gapY } = layout.spacing;
    
    // Calculate cell size based on screen size
    const cellW = width * gapX;
    const cellH = height * gapY;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellW / window.devicePixelRatio;
        const y = r * cellH / window.devicePixelRatio;
        
        transforms.push(this.createTransform(transforms.length, x, y));
      }
    }
    return transforms;
  }

  private static generateScan(layout: any, width: number, height: number): Transform2D[] {
    const transforms: Transform2D[] = [];
    const count = layout.count || 1;
    const x = layout.origin.x * width / window.devicePixelRatio;
    const y = layout.origin.y * height / window.devicePixelRatio;
    
    for (let i = 0; i < count; i++) {
      transforms.push(this.createTransform(i, x, y));
    }
    return transforms;
  }

  private static generateTrack(layout: any, width: number, height: number): Transform2D[] {
    const { screenPositions } = useSceneBridge();

    return Object.values(screenPositions).map((p, i) => ({
      id: i,
      position: { 
        x: p.x * width, 
        y: p.y * height 
      },
      targetPosition: { x: p.x * width, y: p.y * height },
      rotation: 0,
      scale: p.visible ? 1 : 0 // Hide if behind camera
    }));
  }

  private static createTransform(id: number, x: number, y: number): Transform2D {
    return {
      id,
      position: { x, y },
      targetPosition: { x, y },
      rotation: 0,
      scale: 1
    };
  }
}