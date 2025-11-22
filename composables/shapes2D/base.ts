export class Base2D {
  position: { x: number, y: number };

  constructor(params: any) {
    this.position = params.position ?? { x: 0, y: 0 };
  }

  update () {
  }

  dispose () {

  }
}