import { ElementType, LayoutType, ShapeType } from "./constants";
import { Scenes } from "./constants";
import type { SceneConfig } from "./types";

export const scene3DConfig: Partial<Record<Scenes, SceneConfig>> = {
  [Scenes.ASFAY]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.ASSIOMA]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.CONFINE]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.DATASET]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [
      {
        id: 'particles-1',
        shape: ShapeType.RECTANGLES,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 12, y: 12, z: 12 },
          spacing: { x: 100, y: 25, z: 100 },
          origin: { x: 0, y: -200, z: 0 },
        },
        style: {
          size: { x: 0.5, y: 0.5 },
        },
        variation: {
          position: { x: 100, y: 25, z: 100 },
          scale: { x: 1, y: 1, z: 0 },
          speed: { x: 0.1, y: 0.05, z: 0 },
        },
        motion: {
          position: { x: 0, y: 0.05, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        }
      }
    ],
  },

  [Scenes.ESGIBTBROT]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
    // fov: 250,
    // camera: {
    //   x: 0,
    //   y: 0,
    //   z: 200,
    // },
    // type: ElementType.CIRCLES,
    // shapes: {
    //   count: 60,
    //   size: 200,
    //   thickness: 0.005,
    //   depth: 5000,
    //   motion: 2.5,
    // }
  },

  [Scenes.FAKE_OUT]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.FUNCTII]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.GHOSTSSS]: {
    fov: 25,
    camera: {
      x: 0,
      y: 0,
      z: 250,
    },
    elements: [
      {
        id: 'tunnel-1',
        shape: ShapeType.CIRCLES,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 1, y: 1, z: 50 },
          spacing: { x: 0, y: 0, z: 250 },
          origin: { x: 0, y: 0, z: -1250 },
        },
        style: {
          size: { x: 250, y: 250 },
          thickness: 0.01,
        },
        motion: {
          position: { x: 0, y: 0, z: 1 }
        }
      },
    ]
  },

  [Scenes.INTRO_01]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.INTRO_02]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.LIKE_NOTHING]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
    // camera: { x: 0, y: 0, z: 300 },
    // type: ElementType.RECTANGLES,
    // connections: true,
    // shapes: {
    //   gridRows: 15,
    //   gridColumns: 15,
    //   size: { x: 2, y: 2 },
    //   gap: { x: 20, y: 20, z: -150 },
    //   rotation: { x: 0, y: 0, z: 0 },
    //   variation: {
    //     size: { x: 0, y: 0 },
    //     position: { x: 0, y: 0, z: 0 },
    //     gap: { x: 0, y: 0, z: 300 },
    //     rotation: { x: 0, y: Math.PI, z: 0 },
    //   },
    //   motion: {
    //     position: { x: 0, y: 0, z: 0 },
    //     rotation: { x: 0, y: 0, z: 0 },
    //   }
    // }
  },

  [Scenes.MITTERGRIES]: {
    camera: {
      x: 0,
      y: 0,
      z: 100,
    },
    elements: [
      {
        id: 'grid-1',
        shape: ShapeType.RECTANGLES,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 15, y: 30, z: 1 },
          spacing: { x: 120, y: 30, z: 0 },
          origin: { x: 0, y: 0, z: 0 },
        },
        style: {
          size: { x: 60, y: 30 },
        },
        variation: {
          scale: { x: 30, y: 0, z: 0 },
          position: { x: 60, y: 0, z: 0 },
          speed: { x: 0.1, y: 0, z: 0 },
        },
        motion: {
          position: { x: 0.1, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        }
      }
    ]
  },

  [Scenes.MTGO]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.PSSST]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.RFBONGOS]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
    // camera: {
    //   x: 0,
    //   y: 0,
    //   z: 250,
    // },
    // type: ElementType.RECTANGLES,
    // shapes: {
    //   gridRows: 10,
    //   gridColumns: 4,
    //   size: { x: 25, y: 25 },
    //   gap: { x: 40, y: -6, z: 0 },
    //   rotation: { x: 0, y: 0, z: 0 },
    //   variation: {
    //     size: { x: 100, y: 0 },
    //     position: { x: 0, y: 0, z: 0 },
    //     gap: { x: 0, y: 0, z: 0 },
    //     rotation: { x: 0, y: 0, z: Math.PI },
    //   },
    //   motion: {
    //     position: { x: 0.01, y: 0, z: 0 },
    //     rotation: { x: 0, y: 0, z: 0.0005 },
    //   }
    // }
  },

  [Scenes.STAYS_NOWHERE]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.SUPER_JUST]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
    // camera: {
    //   x: 0,
    //   y: 0,
    //   z: 250,
    // },
    // type: ElementType.RECTANGLES,
    // shapes: {
    //   gridRows: 16,
    //   gridColumns: 33,
    //   size: { x: 5, y: 5 },
    //   gap: { x: 17, y: 22, z: 0 },
    //   rotation: { x: 0, y: 0, z: 0 },
    //   variation: {
    //     size: { x: 0, y: 0 },
    //     position: { x: 0, y: 0, z: 0 },
    //     gap: { x: 1, y: 1, z: 0 },
    //     rotation: { x: 0, y: 0, z: 0 },
    //   },
    //   motion: {
    //     position: { x: 0.05, y: -0.1, z: 0 },
    //     rotation: { x: 0, y: 0, z: 0 },
    //   }
    // }
  },

  [Scenes.TUFTEEE]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.USBTEC]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.ZENO]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.ZOHO]: {
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

}