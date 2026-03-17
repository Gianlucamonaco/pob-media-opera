import { Fonts, Layout2DType, OriginModes, Palette, Scenes, Shape2DType, TextAligns } from "./constants";
import { elementIds } from "./sceneLabels";
import { strings } from "./strings";
import type { Scene2DConfig } from "./types";

export const scene2DConfig: Partial<Record<Scenes, Scene2DConfig>> = {
  [Scenes.ASFAY]: {
    elements: [
      {
        id: elementIds.TEXT,
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 64, y: 3 },
          origin: { x: 0.5, y: 0.5 }, // 0.081 touches baseline
          spacing: { x: 0.01, y: 0.25 },
        },
        style: {
          color: Palette.RED,
          fontSize: { px: 10 },
          fontFamily: Fonts.MONO,
          textAlign: TextAligns.CENTER,
          originMode: OriginModes.CENTER,
        },
        content: ['0'],
      }
    ]
  },

  [Scenes.ASSIOMA]: {
    elements: [
      {
        id: elementIds.CONNECTIONS,
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: 0.5, y: 0.5 },
          count: 21,
        },
        style: {
          color: Palette.RED,
        },
      },
    ]
  },

  [Scenes.CONFINE]: {
    elements: [
      {
        id: elementIds.LINES,
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 48, y: 2 },
          spacing: { x: 0.025, y: 0.33 },
          origin: { x: 0.5, y: 0.5 },
        },
        style: {
          color: Palette.RED,
          pxSize: { x: 0, y: 50 },
          originMode: OriginModes.CENTER,
        },
      },
      {
        id: elementIds.CONNECTIONS,
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: 0.5, y: 0.5 },
          count: 10,
        },
        style: {
          color: Palette.RED,
          thickness: 1,
        },
      },
      {
        id: elementIds.SCANS,
        shape: Shape2DType.RECTANGLE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 10,
        },
        style: {
          color: Palette.RED,
          thickness: 1,
          pxSize: { x: 20, y: 20 },
        },
      }

    ]
  },

  [Scenes.DATASET]: {
    elements: [
      {
        id: elementIds.SCANS,
        shape: Shape2DType.RECTANGLE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 50,
        },
        style: {
          color: Palette.RED,
          pxSize: { x: 20, y: 20 },
        },
      }
    ]
  },

  [Scenes.FUNCTIII]: {
    elements: [
      {
        id: elementIds.SCANS,
        shape: Shape2DType.RECTANGLE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 50,
        },
        style: {
          color: Palette.RED,
        },
      },
      {
        id: elementIds.TEXT,
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 50,
        },
        style: {
          color: Palette.WHITE,
          background: Palette.RED,
          fontFamily: Fonts.MONO,
          originMode: OriginModes.CORNER,
          textAlign: TextAligns.LEFT,
        },
        content: ['undefined'],
      }
    ]
  },

  [Scenes.LIKE_NOTHING]: {
    elements: [
      {
        id: elementIds.CONNECTIONS,
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: 0.5, y: 0.5 },
          count: 60,
        },
        style: {
          color: Palette.RED,
        },
      },
    ]
  },

  [Scenes.MTGO]: {
    elements: [
      {
        id: elementIds.CONNECTIONS,
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 16,
        },
        style: {
          color: Palette.RED,
        },
      },
      {
        id: elementIds.TEXT,
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

  [Scenes.SISTEMA]: {
    elements: [
      {
        id: elementIds.TEXT,
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 1 },
          origin: { x: 0.1, y: 0.1782 }, // 0.081 touches baseline
          spacing: { x: 0.1, y: 0.1472 },
        },
        style: {
          color: Palette.DARK,
          fontSize: { y: 0.066 },
          fontFamily: Fonts.SERIF,
          originMode: OriginModes.CORNER,
          textAlign: TextAligns.LEFT,
          revealFade: true,
        },
        content: strings[Scenes.SISTEMA]
      }
    ]
  },

  [Scenes.SOLO_01]: {
    elements: [
      {
        id: elementIds.TEXT,
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
        id: elementIds.TEXT,
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
        content: strings[Scenes.SOLO_02]
      }
    ]
  },

  [Scenes.SOLO_03]: {
    elements: [
      {
        id: elementIds.TEXT,
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
        content: strings[Scenes.SOLO_03]
      }
    ]
  },

  [Scenes.SOLO_04]: {
    elements: [
      {
        id: elementIds.TEXT,
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
        content: strings[Scenes.SOLO_04]
      }
    ]
  },

  [Scenes.STAYS_NOWHERE]: {
    elements: [
      {
        id: elementIds.CONNECTIONS,
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 50,
        },
        style: {
          color: Palette.RED,
        },
      },
    ]
  },

  [Scenes.STRANGE_ATTRACTOR]: {
    elements: [
      {
        id: elementIds.TEXT,
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 1 },
          origin: { x: 0.1, y: 0.1782 }, // 0.081 touches baseline
          spacing: { x: 0.1, y: 0.1472 },
        },
        style: {
          color: Palette.LIGHT,
          fontSize: { y: 0.066 },
          fontFamily: Fonts.SERIF,
          originMode: OriginModes.CORNER,
          textAlign: TextAligns.LEFT,
          revealFade: true,
        },
        content: strings[Scenes.STRANGE_ATTRACTOR]
      }
    ]
  },

  [Scenes.TUFTEEE]: {
    elements: [
      {
        id: elementIds.TEXT,
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 16, y: 10 },
          origin: { x: 0.5, y: 0.5 },
          spacing: { x: 1/16, y: 1/10 },
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
        id: elementIds.SCANS,
        shape: Shape2DType.CROSS,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 3,
        },
        style: {
          color: Palette.RED,
          pxSize: { x: 20, y: 20 },
        },
      },
      {
        id: elementIds.TEXT,
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
        id: elementIds.CONNECTIONS,
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.TRACK,
          origin: { x: -0.5, y: -0.5 },
          count: 36,
        },
        style: {
          color: Palette.RED,
        },
      },
    ],
  },

  [Scenes.ZENO]: {
    elements: [
      {
        id: elementIds.CONNECTIONS,
        shape: Shape2DType.LINE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 72,
        },
        style: {
          color: Palette.RED,
        },
      },
      {
        id: elementIds.TEXT,
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
        id: elementIds.SCANS,
        shape: Shape2DType.RECTANGLE,
        layout: {
          type: Layout2DType.SCAN,
          origin: { x: -0.5, y: -0.5 },
          count: 10,
        },
        style: {
          color: Palette.RED,
          pxSize: { x: 20, y: 20 },
        },
      },
      {
        id: elementIds.TRAILS,
        shape: Shape2DType.CROSS,
        layout: {
          type: Layout2DType.TRACK,
          origin: { x: -0.5, y: -0.5 },
          count: 150,
        },
        style: {
          color: Palette.RED,
          pxSize: { x: 20, y: 20 },
        },
      }
    ],
  },

}