import { ElementType } from "~/composables/shapes3D";

export enum Scenes {
  MITTERGRIES = 'Mittergries',
  GHOSTSSS    = 'Ghostsss',
  ESGIBTBROT  = 'Esgibtbrot',
  RFBONGOS    = 'RFBongos',
  SUPERJUST   = 'Super Just',
}

export const scene3DParams = [
  {
    title: Scenes.MITTERGRIES,
    act: 1,
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
  {
    title: Scenes.GHOSTSSS,
    act: 1,
    camera: {
      x: 0,
      y: 0,
      z: 1,
    },
    type: ElementType.CIRCLES,
    shapes: {
      count: 15,
      size: 250,
      thickness: 0.05,
      depth: 800,
      speed: 0.25,
    }
  },
  {
    title: Scenes.ESGIBTBROT,
    act: 1,
    camera: {
      x: 0,
      y: 0,
      z: 1,
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
  {
    title: Scenes.SUPERJUST,
    act: 1,
    camera: {
      x: 0,
      y: 0,
      z: 1000,
    },
    type: ElementType.RECTANGLES,
    shapes: {
      rows: 28,
      columns: 42,
      size: { x: 10, y: 10 },
      gap: { x: 20, y: 20, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      range: {
        size: { x: 0, y: 0 },
        position: { x: 0, y: 0, z: 0 },
        gap: { x: 1, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      speed: {
        position: { x: 0.01, y: 0, z: 0 },
        rotation: { x: 0, y: 0.01, z: 0 },
      }
    }
  },
    {
    title: Scenes.RFBONGOS,
    act: 1,
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
]