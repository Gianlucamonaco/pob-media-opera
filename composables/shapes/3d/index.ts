import { ElementType } from "~/data/constants";
import { Circles } from "./circles";
import { Connections } from "./connections";
import { Rectangles } from "./rectangles";

export class Shapes3D {
  elements: any[] = [];

  // A Registry mapping type to Class
  private static typeMap: Record<ElementType, new (params: any) => any> = {
    [ElementType.RECTANGLES]: Rectangles,
    [ElementType.CIRCLES]: Circles,
    [ElementType.CONNECTIONS]: Connections,
  };

  create(type: ElementType, params?: any) {
    const ShapeClass = Shapes3D.typeMap[type];
    if (ShapeClass) {
      const instance = new ShapeClass(params);
      this.elements.push(instance);
      return instance;
    }
  }

  update() {
    this.elements.forEach(el => el.update());
  }

  remove (index: number) {
    const element = this.elements[index];

    if (element) {
      element.dispose();
      this.elements.splice(index, 1);
    }
  }

  removeAll () {
    const count = this.elements.length;

    for (let i = count - 1; i >= 0; i--) {
      this.elements[i]?.dispose();
      this.elements.splice(i, 1);
    }
  }

  get count () {
    return this.elements.length;
  }
}