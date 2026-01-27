import { LayoutType, Palette, ShapeType } from "./constants";
import { Scenes } from "./constants";
import type { SceneConfig } from "./types";

export const scene3DConfig: Partial<Record<Scenes, SceneConfig>> = {
  [Scenes.ASFAY]: {
    background: Palette.DARK,
    smoothFactor: 0.2,
    fov: 75,
    camera: { x: 0, y: 0, z: 1 },
    elements: [
      {
        id: 'grid-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 8, y: 3, z: 8 },
          spacing: { x: 150, y: 250, z: 150 },
          origin: { x: 0, y: 0, z: 0 },
        },
        style: {
          size: { x: 4, y: 100 },
          color: Palette.LIGHT,
        },
        variation: {
          position: { x: 50, y: 25, z: 5 },
          scale: { x: 10, y: 5, z: 0 },
        },
        motion: {
          rotation: { x: 0, y: 0.005, z: 0 },
        }
      }
    ]
  },

  [Scenes.ASSIOMA]: {
    fov: 60,
    camera: { x: 0, y: 0, z: 500 },
    elements: [
      {
        id: 'spiral-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.SPIRAL,
          origin: { x: 0, y: 0, z: -500 },
          count: 250,
          radius: 100,
          pitch: 0.25,
          verticalStep: 10,
        },
        style: {
          size: { x: 5, y: 5 },
          rotation: { x: Math.PI * 0.5, y: 0, z: 0 },
        },
        variation: {
          scale: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        },
        motion: {
          position: { x: 0, y: 0, z: 0.35 },
          rotation: { x: 0, y: 0.05, z: 0 },
        },
        groupMotion: {
          rotation: { x: 0, y: 0, z: 0 },
        }
      }
    ],
  },

  [Scenes.CONFINE]: {
    background: Palette.DARK,
    smoothFactor: 0.01,
    camera: { x: 0, y: 0, z: 1000 },
    elements: [
      {
        id: 'flock-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.FLOCK,
          count: 10,
          dimensions: { x: 35, y: 35, z: 100 },
          origin: { x: 0, y: 0, z: 0 },
        },
        style: {
          size: { x: 2.5, y: 2.5 },
          color: Palette.LIGHT,
        },
      },
      {
        id: 'particles-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 8, y: 8, z: 8 },
          spacing: { x: 150, y: 100, z: 250 },
          origin: { x: 0, y: -150, z: 0 },
        },
        style: {
          size: { x: 4, y: 0.5 },
          color: Palette.LIGHT,
          rotation: { x: 0, y: Math.PI * 0.5, z: 0 },
        },
        variation: {
          position: { x: 100, y: 25, z: 100 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 0, z: 0 },
          speed: { x: 0.1, y: 0.05, z: 0 },
        },
        motion: {
          position: { x: 0, y: 0, z: 0.5 },
          rotation: { x: 0, y: 0, z: 0 },
        }
      }
    ]
  },

  [Scenes.DATASET]: {
    background: Palette.DARK,
    smoothFactor: 0.1,
    camera: { x: 0, y: 0, z: 500 },
    elements: [
      {
        id: 'particles-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 12, y: 12, z: 12 },
          spacing: { x: 100, y: 50, z: 100 },
          origin: { x: 0, y: -100, z: 0 },
        },
        style: {
          size: { x: 1.5, y: 1.5 },
          color: Palette.LIGHT,
        },
        variation: {
          position: { x: 100, y: 25, z: 100 },
          rotation: { x: 0, y: 180, z: 0 },
          scale: { x: 0, y: 0, z: 0 },
          speed: { x: 0.1, y: 0.025, z: 0 },
        },
        motion: {
          position: { x: 0, y: 0.05, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        }
      }
    ],
  },

  [Scenes.ESGIBTBROT]: {
    smoothFactor: 0.05,
    fov: 100,
    camera: { x: 0, y: 0, z: 250 },
    elements: [
      {
        id: 'tunnel-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 4, y: 19, z: 16 },
          spacing: { x: 1250, y: 250, z: 500 },
          origin: { x: 0, y: 0, z: -4000 },
        },
        style: {
          size: { x: 100, y: 500 },
        },
        variation: {
          position: { x: 0, y: 0, z: 0 }
        },
        motion: {
          position: { x: 0, y: 0, z: 5 }
        }
      }
    ]
  },

  [Scenes.FAKE_OUT]: {
    background: Palette.DARK,
    smoothFactor: 0.1,
    fov: 100,
    camera: { x: 0, y: -100, z: -160 },
    elements: [
      {
        id: 'grid-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 8, y: 12, z: 8 },
          spacing: { x: 60, y: 48, z: 50 },
          origin: { x: 0, y: 0, z: 0 },
        },
        style: {
          size: { x: 0.25, y: 15 },
          color: Palette.LIGHT,
        },
        variation: {
          scale: { x: 0, y: 2, z: 0 },
          position: { x: 20, y: 0, z: 50 },
          speed: { x: 0, y: 0.5, z: 0 },
        },
        motion: {
          position: { x: 0, y: -0.25, z: -0.05 },
          rotation: { x: 0, y: 0, z: 0 },
        }
      }
    ]
  },

  [Scenes.FUNCTIII]: {
    smoothFactor: 0.25,
    fov: 55,
    camera: { x: 0, y: 25, z: 25 },
    elements: [
      {
        id: 'tunnel-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 6, y: 1, z: 24 },
          spacing: { x: 500, y: 50, z: 200 },
          origin: { x: 0, y: 150, z: -2000 },
        },
        style: {
          size: { x: 100, y: 200 },
        },
        variation: {
          position: { x: 250, y: 75, z: 150 },
          scale: { x: 1, y: 1.5, z: 0 },
          speed: { x: 0, y: 0, z: 5 }
        },
        motion: {
          position: { x: 0, y: 0, z: 12 }
        }
      },
      {
        id: 'tunnel-2',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 4, y: 1, z: 24 },
          spacing: { x: 1000, y: 50, z: 150 },
          origin: { x: 0, y: 150, z: -2000 },
        },
        style: {
          size: { x: 100, y: 250 },
        },
        variation: {
          position: { x: 500, y: 25, z: 100 },
          scale: { x: 0.5, y: 0.25, z: 0 },
          speed: { x: 0, y: 0, z: 4 }
        },
        motion: {
          position: { x: 0, y: 0, z: 9 }
        }
      },
    ]
  },

  [Scenes.GHOSTSSS]: {
    smoothFactor: 0.05,
    fov: 100,
    camera: { x: 0, y: 0, z: 250 },
    elements: [
      {
        id: 'grid-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 24, y: 12, z: 48 },
          spacing: { x: 60, y: 60, z: 24 },
          origin: { x: 0, y: 0, z: -80 },
        },
        style: {
          size: { x: 4, y: 4 },
        },
        motion: {
          position: { x: 0, y: 0, z: -0.5 }
        }
      }
    ]
  },

  [Scenes.LIKE_NOTHING]: {
    smoothFactor: 0.05,
    fov: 75,
    camera: { x: 0, y: 0, z: 10 },
    elements: [
      {
        id: 'grid-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 12, y: 12, z: 12 },
          spacing: { x: 50, y: 50, z: 50 },
          origin: { x: 0, y: 0, z: 0 },
        },
        style: {
          size: { x: 5, y: 25 },
        },
        variation: {
          scale: { x: 1.5, y: 0, z: 0 },
          // speed: { x: 0.1, y: 0.1, z: 0.1 },
        },
        motion: {
          position: { x: 0.025, y: 0, z: 0.025 },
        },
        groupMotion: {
          // rotation: { x: 0.25, y: 0.35, z: 0 },
        }
      }
    ]
  },

  [Scenes.MITTERGRIES]: {
    smoothFactor: 0.1,
    camera: { x: 0, y: 0, z: 75 },
    elements: [
      {
        id: 'grid-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 20, y: 45, z: 1 },
          spacing: { x: 120, y: 28, z: 0 },
          origin: { x: 0, y: 0, z: 0 },
        },
        style: {
          size: { x: 60, y: 30 },
        },
        variation: {
          scale: { x: 0.15, y: 0, z: 0 },
          position: { x: 120, y: 0, z: 0 },
          speed: { x: 0.075, y: 0, z: 0 },
        },
        motion: {
          position: { x: 0.025, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        }
      }
    ]
  },

  [Scenes.MTGO]: {
    background: Palette.DARK,
    smoothFactor: 0.05,
    camera: { x: 0, y: 0, z: 350 },
    elements: [
      {
        id: 'flock-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.FLOCK,
          count: 10,
          dimensions: { x: 350, y: 50, z: 350 },
          origin: { x: 0, y: 0, z: 0 },
        },
        style: {
          size: { x: 1.5, y: 1.5 },
          color: Palette.LIGHT,
        },
      }
    ]
  },

  [Scenes.PSSST]: {
    smoothFactor: 0.25,
    fov: 100,
    camera: { x: 0, y: 0, z: 250 },
    elements: [
      {
        id: 'tunnel-1',
        shape: ShapeType.CIRCLE,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 5, y: 5, z: 64 },
          spacing: { x: 500, y: 500, z: 50 },
          origin: { x: 0, y: 0, z: -1500 },
        },
        style: {
          size: { x: 24, y: 24 },
          thickness: 1,
        },
        variation: {
          position: { x: 0, y: 10, z: 0 }
        },
        motion: {
          position: { x: 0, y: 0, z: 1 }
        }
      }
    ]
  },

  [Scenes.RFBONGOS]: {
    fov: 60,
    camera: { x: 0, y: 0, z: 10 },
    elements: [
      {
        id: 'rectangles-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.SPHERE,
          origin: { x: 0, y: 0, z: 0 },
          count: 250,
          radius: 400,
          pitch: 10,
          verticalStep: 2,
        },
        style: {
          size: { x: 25, y: 75 },
        },
        variation: {
          scale: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        }
      }
    ],
  },

  [Scenes.SISTEMA]: {
    fov: 50,
    smoothFactor: 0.15,
    camera: { x: 0, y: 0, z: 500 },
    elements: [
      {
        id: 'flock-1',
        shape: ShapeType.CIRCLE,
        layout: {
          type: LayoutType.FLOCK,
          count: 15,
          dimensions: { x: 500, y: 500, z: 500 },
          origin: { x: 0, y: 0, z: 0 },
        },
        style: {
          size: { x: 25, y: 25 },
          thickness: 0.02,
        },
        variation: {
          position: { x: 0.25, y: 0.25, z: 25 },
        },
        motion: {
          position: { x: 0, y: 0, z: 2.5 },
          scale: { x: 0.025, y: 0.025, z: 0.025 },
        }
      }
    ]
  },

  [Scenes.SOLO_01]: {
    background: Palette.RED,
    camera: { x: 0, y: 0, z: 100 },
    elements: [
      {
        id: 'grid-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 20, y: 9, z: 1 },
          spacing: { x: 12, y: 17, z: 0 },
          origin: { x: 0, y: 0, z: 0 },
        },
        style: {
          size: { x: 2, y: 17 },
          color: Palette.LIGHT,
        },
        variation: {
          scale: { x: 1, y: 0, z: 0 },
          position: { x: 0.5, y: 0, z: 0 },
        },
        motion: {
          position: { x: 0, y: 0, z: 0 },
        }
      }
    ],
  },

  [Scenes.SOLO_02]: {
    background: Palette.RED,
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.SOLO_03]: {
    background: Palette.RED,
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.SOLO_04]: {
    background: Palette.RED,
    camera: { x: 0, y: 0, z: 100 },
    elements: [],
  },

  [Scenes.STAYS_NOWHERE]: {
    background: Palette.DARK,
    camera: { x: 0, y: 0, z: 1000 },
    elements: [
      {
        id: 'sphere-matrix-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.SPHERE_MATRIX,
          dimensions: { x: 4, y: 4, z: 4 },
          spacing: { x: 500, y: 350, z: 500 },
          count: 25,
          radius: 50,
          origin: { x: 0, y: 0, z: 0 },
        },
        style: {
          size: { x: 3, y: 3 },
          rotation: { x: 0, y: 0, z: 0 },
          color: Palette.LIGHT,
        },
        variation: {
        },
        motion: {
        },
      },
    ],
  },

  [Scenes.SUPER_JUST]: {
    smoothFactor: 0.2,
    camera: { x: 0, y: 0, z: 250 },
    elements: [
      {
        id: 'grid-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 63, y: 35, z: 1 },
          spacing: { x: 38, y: 38, z: 48 },
          origin: { x: 0, y: 0, z: 0 },
        },
        style: {
          size: { x: 5, y: 5 },
        },
        variation: {
          speed: { x: 0, y: -0.005, z: 0 },
        },
        motion: {
          position: { x: 0.05, y: -0.01, z: 0 },
        }
      }
    ],
  },

  [Scenes.TUFTEEE]: {
    smoothFactor: 0.1,
    camera: { x: 0, y: 0, z: 520 },
    elements: [
      {
        id: 'grid-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.GRID,
          dimensions: { x: 480, y: 20, z: 1 },
          spacing: { x: 60, y: 60, z: 0 },
          origin: { x: 0, y: 0, z: 0 },
        },
        style: {
          size: { x: 4, y: 60 },
        },
        variation: {
          scale: { x: 6, y: 0, z: 0 },
          position: { x: 60, y: 0, z: 0 },
          speed: { x: 1, y: 0, z: 0 },
        },
        motion: {
          position: { x: 1.5, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          // scale: { x: 0, y: 0, z: 0 },
        }
      }
    ]
  },

  [Scenes.USBTEC]: {
    fov: 75,
    smoothFactor: 0.05,
    camera: { x: 0, y: 0, z: 1000 },
    elements: [
      {
        id: 'flock-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.FLOCK,
          count: 300,
          dimensions: { x: 2500, y: 1500, z: 2000 },
          origin: { x: 100, y: -250, z: -100 },
        },
        style: {
          size: { x: 5, y: 5 },
        },
        variation: {
          position: { x: 0.1, y: 0.1, z: 0.1 },
          speed: { x: 0.2, y: 0.1, z: 0.1 },
        },
        motion: {
          position: { x: 0.05, y: 0, z: -0.05 },
          rotation: { x: 0, y: -0.0028, z: 0 },
          radial: -0.24,
        },
        groupMotion: {
        }
      },
      {
        id: 'flock-2',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.FLOCK,
          count: 250,
          dimensions: { x: 1500, y: 1500, z: 2500 },
          origin: { x: -350, y: 50, z: -350 },
        },
        style: {
          size: { x: 5, y: 5 },
        },
        variation: {
          position: { x: 0.1, y: 0.1, z: 0.1 },
          speed: { x: 0.1, y: 0.1, z: 0.15 },
        },
        motion: {
          position: { x: -0.05, y: 0, z: 0.05 },
          rotation: { x: 0, y: -0.0023, z: 0 },
          radial: -0.38,
        },
        groupMotion: {
        }
      },
      {
        id: 'flock-3',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.FLOCK,
          count: 250,
          dimensions: { x: 1500, y: 1000, z: 1000 },
          origin: { x: 550, y: 150, z: 100 },
        },
        style: {
          size: { x: 5, y: 5 },
        },
        variation: {
          position: { x: 0.1, y: 0.1, z: 0.1 },
          speed: { x: 0.15, y: 0.1, z: 0.1 },
        },
        motion: {
          position: { x: -0.05, y: 0, z: 0.05 },
          rotation: { x: 0, y: -0.0043, z: 0 },
          radial: -0.31,
        },
        groupMotion: {
        }
      }
    ]
  },

  [Scenes.ZENO]: {
    smoothFactor: 0.1,
    camera: { x: 0, y: 0, z: 100 },
    elements: [
      {
        id: 'flock-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.FLOCK,
          count: 160,
          dimensions: { x: 240, y: 240, z: 100 },
          // spacing: { x: 16, y: 32, z: 1 },
          origin: { x: 0, y: 0, z: 80 },
        },
        style: {
          size: { x: 2, y: 2 },
        },
        variation: {
          scale: { x: 0, y: 1, z: 0 },
          position: { x: 0, y: 32, z: 1 },
          speed: { x: 0, y: 0.25, z: 0.06 },
        },
        motion: {
          position: { x: 0, y: 0.25, z: 0.03 },
          rotation: { x: 0, y: 0.025, z: 0 },
        }
      },
      {
        id: 'flock-2',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.FLOCK,
          count: 160,
          dimensions: { x: 240, y: 240, z: 100 },
          // spacing: { x: 16, y: 32, z: 1 },
          origin: { x: 0, y: 0, z: -80 },
        },
        style: {
          size: { x: 2, y: 2 },
        },
        variation: {
          scale: { x: 0, y: 1, z: 0 },
          position: { x: 0, y: 32, z: 1 },
          speed: { x: 0, y: 0.25, z: 0.05 },
        },
        motion: {
          position: { x: 0, y: -0.15, z: 0.04 },
          rotation: { x: 0, y: 0.025, z: 0 },
        }
      }
    ]
  },

  [Scenes.ZOHO]: {
    background: Palette.DARK,
    smoothFactor: 0.01,
    camera: { x: 0, y: 400, z: 0.1 },
    elements: [
      {
        id: 'flock-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.FLOCK,
          count: 10,
          dimensions: { x: 35, y: 35, z: 100 },
          origin: { x: 0, y: 0, z: 0 },
        },
        style: {
          size: { x: 2.5, y: 2.5 },
          color: Palette.LIGHT,
        },
      },
      {
        id: 'particles-1',
        shape: ShapeType.RECTANGLE,
        layout: {
          type: LayoutType.SPHERE,
          count: 200,
          radius: 250,
          origin: { x: 0, y: 0, z: 0 },
        },
        style: {
          size: { x: 1, y: 1 },
          color: Palette.LIGHT,
          rotation: { x: 0, y: 0, z: 0 },
        },
        variation: {
          position: { x: 100, y: 25, z: 100 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 0, z: 0 },
          speed: { x: 0.1, y: 0.05, z: 0 },
        },
        motion: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        }
      }
    ]
  },

}