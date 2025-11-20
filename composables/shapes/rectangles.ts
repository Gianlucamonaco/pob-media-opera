import * as THREE from "three";
import { use3DScene } from "../general";
import { Base } from "./base";

let dummy = new THREE.Object3D();

export class Rectangles extends Base {

  data: { position: { x?: number, y?: number, z?: number }; size: number; speed: number }[][];
  ROW_COUNT = 25;
  RECT_PER_ROW = 10;

  constructor(params: any) {
    super(params)

    const scene = use3DScene();
    const rowHeight = this.ROW_COUNT;
    const instanceCount = this.ROW_COUNT * this.RECT_PER_ROW;

    this.geometry = new THREE.PlaneGeometry(1, rowHeight);
    this.material = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });

    // Each row contains multiple rectangles
    this.data = Array.from(
      { length: this.ROW_COUNT },
      (_, i) =>
        Array.from({ length: this.RECT_PER_ROW }, () => ({
          position: {
            x: window?.innerWidth ? (Math.random() - 0.5) * window.innerWidth : 0,
            y: i * rowHeight - this.ROW_COUNT * rowHeight / 2,
            z: (Math.random() - 0.5) * 50,
          },
          size: 20 + Math.random() * 25,
          speed: 0.05 + Math.random() * 0.15,
        }))
    );

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, instanceCount);

    for (let i = 0; i < instanceCount; i++) {
      dummy.position.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }

    scene.value?.add(this.mesh);
  }

  override update () {
    if (!window?.innerWidth) return;

    const { $wsAudio } = useNuxtApp() as any;

    const width = window.innerWidth;
    const rowHeight = this.ROW_COUNT;

    let instanceIndex = 0; // for the instanced mesh

    for (let i = 0; i < this.ROW_COUNT; i++) {
      const row = this.data[i];

      for (let r = 0; r < this.RECT_PER_ROW; r++) {
        const rect = row?.[r] as any;

        const channelValue = $wsAudio[(i % 4) + 1][0] ?? 0;
        const speed = (1 + rect.speed) * channelValue;

        rect.position.x += rect.speed + speed;

        // Wrap around
        if (rect.position.x > width / 2) rect.position.x = -width / 2;

        // Update instance
        dummy.position.set(rect.position.x, rect.position.y, rect.position.z);
        dummy.scale.set(rect.size, 1, 1);
        dummy.updateMatrix();

        this.mesh.setMatrixAt(instanceIndex, dummy.matrix);
        instanceIndex++;
      }
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

}