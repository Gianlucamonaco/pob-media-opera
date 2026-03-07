import { Fonts, Layout2DType, OriginModes, Palette, Scenes, Shape2DType, TextAligns } from "./constants";
import { strings } from "./strings";
import type { Scene2DConfig } from "./types";

export const scene2DConfig: Partial<Record<Scenes, Scene2DConfig>> = {

  [Scenes.ASSIOMA]: {
    elements: [
      {
        id: 'connections-1',
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: 0.5, y: 0.5 },
          count: 21,
        },
        style: {
          color: Palette.RED,
          size: { x: 50, y: 50 },
        },
      },
    ]
  },

  [Scenes.CONFINE]: {
    elements: [
      {
        id: 'lines-1',
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 48, y: 2 },
          spacing: { x: 0.025, y: 1 },
          origin: { x: 0.5, y: 0.5 },
        },
        style: {
          color: Palette.RED,
          size: { x: 0, y: 50 },
          originMode: OriginModes.CENTER,
        },
      },
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
          thickness: 1,
          size: { x: 0, y: 0 },
        },
      },
      {
        id: 'scan-1',
        shape: Shape2DType.RECTANGLE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 10,
        },
        style: {
          color: Palette.RED,
          thickness: 1,
          size: { x: 20, y: 20 },
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
      },
      {
        id: 'labels-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 50,
        },
        style: {
          color: Palette.WHITE,
          size: { x: 40, y: 40 },
          background: Palette.RED,
          fontFamily: Fonts.MONO,
          originMode: OriginModes.CORNER,
          textAlign: TextAligns.LEFT,
        },
        content: ['undefined'],
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
          dimensions: { x: 1, y: 1 },
          origin: { x: 0.1, y: 0.1782 }, // 0.081 touches baseline
          spacing: { x: 0.1, y: 0.1472 },
        },
        style: {
          color: Palette.RED, //'#700000',
          fontSize: { y: 0.066 },
          fontFamily: Fonts.SERIF,
          originMode: OriginModes.CORNER,
          textAlign: TextAligns.LEFT,
          revealFade: true,
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
          spacing: { x: 0.1, y: 0.1 },
        },
        style: {
          color: Palette.RED, //'#700000',
          fontSize: { px: 64 },
          originMode: OriginModes.CENTER,
          textAlign: TextAligns.CENTER,
          textWrap: false,
        },
        content: strings[Scenes.SOLO_02]
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
          spacing: { x: 0.1, y: 0.1 },
        },
        style: {
          color: Palette.RED, //'#700000',
          fontSize: { px: 64 },
          originMode: OriginModes.CENTER,
          textAlign: TextAligns.CENTER,
        },
        content: strings[Scenes.SOLO_03]
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
        content: strings[Scenes.SOLO_04]
      }
    ],
  },

  [Scenes.STAYS_NOWHERE]: {
    elements: [
      {
        id: 'connections-1',
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: 0.5, y: 0.5 },
          count: 50,
        },
        style: {
          color: Palette.RED,
          size: { x: 50, y: 50 },
        },
      },
    ]
  },

  [Scenes.TUFTEEE]: {
    elements: [
      {
        id: 'text-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 10 },
          origin: { x: 0.5, y: 0.5 },
          spacing: { x: 0.1, y: 0.1 },
        },
        style: {
          color: Palette.RED,
          fontSize: { px: 10 },
          fontFamily: Fonts.MONO,
          originMode: OriginModes.CENTER,
          textAlign: TextAligns.CENTER,
        },
        content: strings[Scenes.TUFTEEE]
      }
    ]
  },

  [Scenes.USBTEC]: {
    elements: [
      {
        id: 'scan-1',
        shape: Shape2DType.CROSS,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 3,
        },
        style: {
          color: Palette.RED,
          size: { x: 20, y: 20 },
        },
      },
      {
        id: 'text-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          origin: { x: 0.01, y: 0.02 },
          spacing: { x: 0.05, y: 0.1 },
          dimensions: { x: 3, y: 1 },
        },
        style: {
          color: Palette.RED,
          fontSize: { px: 10 },
          fontFamily: Fonts.MONO,
          textAlign: TextAligns.LEFT,
          originMode: OriginModes.CORNER,
          textBreak: ',',
        },
        content: [''],
      },
      {
        id: 'connections-1',
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.TRACK,
          origin: { x: -0.5, y: -0.5 },
          count: 15,
        },
        style: {
          color: Palette.RED,
          size: { x: 50, y: 50 },
        },
      },
    ],
  },

  [Scenes.ZENO]: {
    elements: [
      {
        id: 'connections-1',
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 72,
        },
        style: {
          color: Palette.RED,
          size: { x: 20, y: 20 },
        },
      },
      {
        id: 'text-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          origin: { x: 0.5, y: 0.5 },
          spacing: { x: 0.05, y: 0.1 },
          dimensions: { x: 16, y: 2 },
        },
        style: {
          color: Palette.RED,
          fontSize: { px: 10 },
          fontFamily: Fonts.MONO,
          textAlign: TextAligns.CENTER,
          originMode: OriginModes.CENTER,
        },
        content: ['00'],
      },
    ]
  },

  [Scenes.ZOHO]: {
    elements: [
      {
        id: 'scan-1',
        shape: Shape2DType.RECTANGLE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 10,
        },
        style: {
          color: Palette.RED,
          size: { x: 20, y: 20 },
        },
      },
      {
        id: 'track-1',
        shape: Shape2DType.CROSS,
        layout: {
          type: Layout2DType.TRACK,
          origin: { x: -0.5, y: -0.5 },
          count: 300,
        },
        style: {
          color: Palette.RED,
          size: { x: 20, y: 20 },
        },
      }
    ],
  },

}