import { TextLines } from "./text";

export class Shapes2D {
  elements: any; // Can contain one or more 2D components

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

  removeAll () {
    const count = this.elements.length;

    for (let i = count - 1; i >= 0; i--) {
      this.elements[i].dispose();
      this.elements.splice(i, 1);
    }
  }

  create (type: ElementType, params?: any) {
    let shapes;

    switch (type) {
      case ElementType.TEXT:
        shapes = new TextLines(params);
        break;
    }

    if (shapes) this.elements.push(shapes);
  }

  update () {
    this.elements.forEach((el: TextLines) => el.update());
  }

  get count () {
    return this.elements.length;
  }
}

export enum ElementType {
  TEXT = 'text',
}