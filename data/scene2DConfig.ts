import { Layout2DType, Scenes, Shape2DType } from "./constants";
import { strings } from "./strings";
import type { Scene2DConfig } from "./types";

export const scene2DConfig: Partial<Record<Scenes, Scene2DConfig>> = {

  [Scenes.CONFINE]: {
    elements: [
      {
        id: 'lines-1',
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 8, y: 1 },
          spacing: { x: 0.02, y: 0 },
          origin: { x: 0.5, y: 0.5 },
        },
        style: {
          size: { x: 0, y: 50 },
          color: '#ff0000'
        },
      },
      {
        id: 'connections-1',
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 8, y: 1 },
          spacing: { x: 0.125, y: 0 },
          origin: { x: 0.5, y: 0 },
        },
        style: {
          size: { x: 0, y: 20 },
          color: '#ff0000'
        },
      }
    ]
  },

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

  [Scenes.FUNCTIII]: {
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
          size: { x: 40, y: 40 },
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
          origin: { x: 0.5, y: 0.5 },
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
          type: Layout2DType.GRID,
          dimensions: { x: 4, y: 5 },
          origin: { x: 0.5, y: 0.5 },
          spacing: { x: 0.15, y: 0.1 },
        },
        style: {
          fontSize: { y: 0.015 },
          color: '#ff0000'
        },
      }
    ]
  },

  [Scenes.MTGO]: {
    elements: [
      {
        id: 'connections-1',
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: 0.5, y: 0.5 },
          count: 10,
        },
        style: {
          size: { x: 50, y: 50 },
          color: '#ff0000'
        },
      }
    ]
  },


  [Scenes.TUFTEEE]: {
    elements: [
      {
        id: 'text-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 6, y: 5 },
          origin: { x: 0.5, y: 0.4 },
          spacing: { x: 0.2, y: 0.2 },
        },
        style: {
          fontSize: { y: 0.015 },
          color: '#ff0000'
        },
        content: strings[Scenes.TUFTEEE]
      }
    ]
  },

  [Scenes.ZENO]: {
    elements: [
      {
        id: 'text-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 20 },
          origin: { x: 0.5, y: 0.5 },
          spacing: { x: 0, y: 0.05 },
        },
        style: {
          fontSize: { y: 0.015 },
          color: '#ff0000',
          textAlign: 'center',
        },
        motion: {
          position: { x: 0, y: 2 }
        },
        content: strings[Scenes.ZENO]
      }
    ]
  },

}