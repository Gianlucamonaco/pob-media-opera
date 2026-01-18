import { Layout2DType, Scenes, Shape2DType } from "./constants";
import { strings } from "./strings";
import type { Scene2DConfig } from "./types";

export const scene2DConfig: Partial<Record<Scenes, Scene2DConfig>> = {
  [Scenes.DATASET]: {
    elements: [
      {
        id: 'scan-1',
        shape: Shape2DType.RECTANGLE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 25,
        },
        style: {
          size: { x: 20, y: 20 },
          color: '#ff0000'
        },
      }
    ]
  },

  [Scenes.INTRO_01]: {
    elements: [
      {
        id: 'text-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 4, y: 5 },
          origin: { x: 0.25, y: 0 },
          spacing: { x: 0.25, y: 0.2 },
        },
        style: {
          fontSize: { y: 0.015 },
          color: '#ff0000'
        },
        content: strings[Scenes.INTRO_01]
      }
    ]
  },

  [Scenes.INTRO_02]: {
    elements: [
      {
        id: 'scan-1',
        shape: Shape2DType.RECTANGLE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: 0.5, y: 0.5 },
          count: 1,
        },
        style: {
          size: { x: 10, y: 10 },
          color: '#ff0000'
        },
      }
    ]
  },
}