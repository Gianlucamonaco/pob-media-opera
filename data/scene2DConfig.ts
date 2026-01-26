import { Fonts, Layout2DType, OriginModes, Palette, Scenes, Shape2DType, TextAligns } from "./constants";
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
          color: Palette.RED,
          size: { x: 0, y: 50 },
        },
      },
      {
        id: 'connections-1',
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: 0.5, y: 0.5 },
          count: 15,
        },
        style: {
          color: Palette.RED,
          thickness: 1,
          size: { x: 10, y: 10 },
        },
      },
      {
        id: 'matrix-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 24, y: 30 },
          spacing: { x: 0.042, y: 0.034 },
          origin: { x: 0, y: 0 },
        },
        style: {
          color: Palette.RED,
          fontSize: { px: 10 },
          fontFamily: Fonts.MONO,
          originMode: OriginModes.CORNER,
          textAlign: TextAligns.LEFT,
        },
        content: strings[Scenes.CONFINE],
      },
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
          count: 50,
        },
        style: {
          color: Palette.RED,
          size: { x: 20, y: 20 },
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
          count: 50,
        },
        style: {
          color: Palette.RED,
          size: { x: 40, y: 40 },
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
          color: Palette.RED,
          size: { x: 50, y: 50 },
        },
      },
      {
        id: 'matrix-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.MATRIX,
          dimensions: { x: 80, y: 50 },
        },
        style: {
          color: Palette.RED,
          fontSize: { px: 10 },
          textAlign: TextAligns.CENTER,
        },
      },
    ]
  },

  [Scenes.SOLO_01]: {
    elements: [
      {
        id: 'text-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 8, y: 7 },
          origin: { x: 0.01, y: 0.01 },
          spacing: { x: 0.104, y: 0.144 },
        },
        style: {
          color: Palette.DARK,
          fontSize: { px: 24 },
          originMode: OriginModes.CORNER,
          textAlign: TextAligns.LEFT,
          textWrap: true,
          maxWidth: 0.208,
        },
        content: strings[Scenes.SOLO_01]
      }
    ]
  },

  [Scenes.SOLO_02]: {
    elements: [
      {
        id: 'text-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 1 },
          origin: { x: 0.5, y: 0.5 },
          spacing: { x: 0.5, y: 0.33 },
        },
        style: {
          color: Palette.DARK,
          fontSize: { px: 24 },
          originMode: OriginModes.CENTER,
          textAlign: TextAligns.CENTER,
        },
        content: ['Act 1 end']
      }
    ],
  },

  [Scenes.SOLO_03]: {
    elements: [
      {
        id: 'text-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 1 },
          origin: { x: 0.5, y: 0.5 },
          spacing: { x: 0.5, y: 0.33 },
        },
        style: {
          color: Palette.DARK,
          fontSize: { px: 24 },
          originMode: OriginModes.CENTER,
          textAlign: TextAligns.CENTER,
        },
        content: ['Act 2 end']
      }
    ],
  },

  [Scenes.SOLO_04]: {
    elements: [
      {
        id: 'text-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 1 },
          origin: { x: 0.5, y: 0.5 },
          spacing: { x: 0.5, y: 0.33 },
        },
        style: {
          color: Palette.DARK,
          fontSize: { px: 24 },
          originMode: OriginModes.CENTER,
          textAlign: TextAligns.CENTER,
        },
        content: ['Act 3 end']
      }
    ],
  },

  [Scenes.TUFTEEE]: {
    elements: [
      {
        id: 'text-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 6, y: 5 },
          origin: { x: 0, y: 0 },
          spacing: { x: 0.2, y: 0.2 },
        },
        style: {
          color: Palette.RED,
          fontSize: { px: 10 },
          fontFamily: Fonts.MONO,
          originMode: OriginModes.CORNER,
          textAlign: TextAligns.LEFT,
        },
        content: strings[Scenes.TUFTEEE]
      }
    ]
  },

  [Scenes.ZENO]: {
    elements: [
    ]
  },

}