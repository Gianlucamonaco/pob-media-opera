import { ElementType } from "~/composables/shapes3D";
import { Scenes } from "./constants";
import type { Scene3DConfig } from "./types";

export const scene3DConfig: Scene3DConfig = {
  [Scenes.ASFAY]: {
    camera: { x: 0, y: 0, z: 100 },
    type: ElementType.RECTANGLES,
    shapes: {}
  },

  [Scenes.ASSIOMA]: {
    camera: { x: 0, y: 0, z: 100 },
    type: ElementType.RECTANGLES,
    shapes: {}
  },

  [Scenes.CONFINE]: {
    camera: { x: 0, y: 0, z: 100 },
    type: ElementType.RECTANGLES,
    shapes: {}
  },

  [Scenes.DATASET]: {
    camera: { x: 0, y: 0, z: 500 },
    type: ElementType.RECTANGLES,
    shapes: {
      rows: 10,
      columns: 6,
      size: { x: 5, y: 2 },
      gap: { x: 100, y: 50, z: -150 },
      rotation: { x: 0, y: 0, z: 0 },
      range: {
        size: { x: 45, y: 0 },
        position: { x: 5, y: 5, z: 50 },
        gap: { x: 1, y: 1, z: 250 },
        rotation: { x: 0, y: 0, z: Math.PI },
      },
      speed: {
        position: { x: 0, y: 0, z: 0.025 },
        rotation: { x: 0, y: 0.005, z: 0.001 },
      }
    }
  },

  [Scenes.ESGIBTBROT]: {
    camera: {
      x: 0,
      y: 0,
      z: 200,
    },
    type: ElementType.CIRCLES,
    shapes: {
      count: 50,
      size: 250,
      thickness: 0.005,
      depth: 1800,
      speed: 1.5,
    }
  },

  [Scenes.FAKEOUT]: {
    camera: { x: 0, y: 0, z: 100 },
    type: ElementType.RECTANGLES,
    shapes: {}
  },

  [Scenes.FUNCTII]: {
    camera: { x: 0, y: 0, z: 100 },
    type: ElementType.RECTANGLES,
    shapes: {}
  },

  [Scenes.GHOSTSSS]: {
    camera: {
      x: 0,
      y: 0,
      z: 250,
    },
    type: ElementType.CIRCLES,
    shapes: {
      count: 15,
      size: 250,
      thickness: 0.05,
      depth: 800,
      speed: 0.5,
    }
  },

  [Scenes.INTRO_01]: {
    camera: {
      x: 0,
      y: 0,
      z: 100,
    },
    type: ElementType.RECTANGLES,
    shapes: {
      rows: 3,
      columns: 3,
      size: { x: 30, y: 30 },
      gap: { x: 60, y: 60, z: 60 },
      rotation: { x: 0, y: 0, z: 0 },
      range: {
        size: { x: 0, y: 0 },
        position: { x: 0, y: 0, z: 0 },
        gap: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      speed: {
        position: { x: 0, y: 0, z: 0.1 },
        rotation: { x: 0, y: 0, z: 0 },
      }
    }
  },

  [Scenes.INTRO_02]: {
    camera: {
      x: 0,
      y: 0,
      z: 100,
    },
    type: ElementType.RECTANGLES,
    shapes: {
      rows: 3,
      columns: 3,
      size: { x: 30, y: 30 },
      gap: { x: 60, y: 60, z: 60 },
      rotation: { x: 0, y: 0, z: 0 },
      range: {
        size: { x: 0, y: 0 },
        position: { x: 0, y: 0, z: 0 },
        gap: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      speed: {
        position: { x: 0, y: 0, z: 0.1 },
        rotation: { x: 0, y: 0, z: 0 },
      }
    }
  },

  [Scenes.LIKENOTHING]: {
    camera: { x: 0, y: 0, z: 300 },
    type: ElementType.RECTANGLES,
    connections: true,
    shapes: {
      rows: 15,
      columns: 15,
      size: { x: 2, y: 2 },
      gap: { x: 20, y: 20, z: -150 },
      rotation: { x: 0, y: 0, z: 0 },
      range: {
        size: { x: 0, y: 0 },
        position: { x: 0, y: 0, z: 0 },
        gap: { x: 0, y: 0, z: 300 },
        rotation: { x: 0, y: Math.PI, z: 0 },
      },
      speed: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      }
    }
  },

  [Scenes.MITTERGRIES]: {
    camera: {
      x: 0,
      y: 0,
      z: 100,
    },
    type: ElementType.RECTANGLES,
    shapes: {
      rows: 30,
      columns: 15,
      size: { x: 30, y: 30 },
      gap: { x: 60, y: 0, z: -10 },
      rotation: { x: 0, y: 0, z: 0 },
      range: {
        size: { x: 60, y: 0 },
        position: { x: 0, y: 0, z: 0 },
        gap: { x: 10, y: 0, z: -20 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      speed: {
        position: { x: 0.05, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      }
    }
  },

  [Scenes.MTGO]: {
    camera: { x: 0, y: 0, z: 100 },
    type: ElementType.RECTANGLES,
    shapes: {}
  },

  [Scenes.PSSST]: {
    camera: { x: 0, y: 0, z: 100 },
    type: ElementType.RECTANGLES,
    shapes: {}
  },

  [Scenes.RFBONGOS]: {
    camera: {
      x: 0,
      y: 0,
      z: 250,
    },
    type: ElementType.RECTANGLES,
    shapes: {
      rows: 10,
      columns: 4,
      size: { x: 25, y: 25 },
      gap: { x: 40, y: -6, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      range: {
        size: { x: 100, y: 0 },
        position: { x: 0, y: 0, z: 0 },
        gap: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: Math.PI },
      },
      speed: {
        position: { x: 0.01, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0.0005 },
      }
    }
  },

  [Scenes.STAYSNOWHERE]: {
    camera: { x: 0, y: 0, z: 100 },
    type: ElementType.RECTANGLES,
    shapes: {}
  },

  [Scenes.SUPERJUST]: {
    camera: {
      x: 0,
      y: 0,
      z: 250,
    },
    type: ElementType.RECTANGLES,
    shapes: {
      rows: 16,
      columns: 33,
      size: { x: 5, y: 5 },
      gap: { x: 17, y: 22, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      range: {
        size: { x: 0, y: 0 },
        position: { x: 0, y: 0, z: 0 },
        gap: { x: 1, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      speed: {
        position: { x: 0.05, y: -0.1, z: 0 },
        rotation: { x: 0, y: 0.01, z: 0 },
      }
    }
  },

  [Scenes.TUFTEEE]: {
    camera: { x: 0, y: 0, z: 100 },
    type: ElementType.RECTANGLES,
    shapes: {}
  },

  [Scenes.USBTEC]: {
    camera: { x: 0, y: 0, z: 100 },
    type: ElementType.RECTANGLES,
    shapes: {}
  },

  [Scenes.ZENO]: {
    camera: { x: 0, y: 0, z: 100 },
    type: ElementType.RECTANGLES,
    shapes: {}
  },

  [Scenes.ZOHO]: {
    camera: { x: 0, y: 0, z: 100 },
    type: ElementType.RECTANGLES,
    shapes: {}
  },

}