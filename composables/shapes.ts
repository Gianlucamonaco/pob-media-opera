import { Circles } from "./shapes/circles";
import { Rectangles } from "./shapes/rectangles";

export class Shapes {
  elements: any; // Can contain one or more InstancedMeshes

  constructor() {
    this.elements = [];
  }

  remove (index: number) {
    const element = this.elements[index];

    if (element) {
      element.dispose();
      this.elements.splice(index, 1);
    }
  }

  create (type: ElementType, params?: any) {
    let shapes;

    switch (type) {
      case 'rectangles':
        shapes = new Rectangles(params);
        break;

      case 'circles':
        shapes = new Circles(params);
        break;
    }

    if (shapes) this.elements.push(shapes);
  }

  update () {
    this.elements.forEach((el: Rectangles | Circles) => el.update());
  }
}

export enum ElementType {
  RECTANGLES = 'rectangles',
  CIRCLES    = 'circles',
}