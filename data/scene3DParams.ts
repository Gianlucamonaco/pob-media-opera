import { ElementType } from "~/composables/shapes3D";

export const scene3DParams = [
  {
    title: 'Mittergries',
    act: 1,
    camera: {
      x: 0,
      y: 0,
      z: 100,
    },
    type: ElementType.RECTANGLES,
    shapes: {
      rows: 30,
      columns: 8,
      rectW: 30,
      rectH: 30,
      rectVariation: 60,
      gapX: 60,
      gapY: 0,
      speed: 0.05,
    }
  },
  {
    title: 'Ghostsss',
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
    title: 'Esgibtbrot',
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
    title: 'Super Just',
    act: 1,
    camera: {
      x: 0,
      y: 0,
      z: 1000,
    },
    type: ElementType.RECTANGLES,
    shapes: {
      rows: 25,
      columns: 40,
      rectW: 10,
      rectH: 10,
      rectVariation: 0,
      gapY: 20,
      gapX: 40,
      speed: 0.01,
    }
  },
    {
    title: 'RFBongos',
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
      rectW: 25,
      rectH: 25,
      rectVariation: 100,
      gapY: -6,
      gapX: 40,
      speed: 0.01,
    }
  },
]