import * as THREE from "three";
import { useScene } from "../general";
import { Base } from "./base";

let dummy = new THREE.Object3D();

export class Rectangles extends Base {
  rows: { position: number; size: number; speed: number }[][];
  ROW_COUNT = 25;
  RECT_PER_ROW = 10;

  constructor(params: any) {
    super(params)

    const scene = useScene();
    const rowHeight = this.ROW_COUNT;
    const instanceCount = this.ROW_COUNT * this.RECT_PER_ROW;

    this.geometry = new THREE.PlaneGeometry(1, rowHeight);
    this.material = new THREE.MeshBasicMaterial({ color: 0x000000 });

    // Each row contains multiple rectangles
    this.rows = Array.from(
      { length: this.ROW_COUNT },
      () =>
        Array.from({ length: this.RECT_PER_ROW }, () => ({
          position: window?.innerWidth ? (Math.random() - 0.5) * window.innerWidth : 0,
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
      const row = this.rows[i];

      for (let r = 0; r < this.RECT_PER_ROW; r++) {
        const rect = row?.[r] as any;

        const channelValue = $wsAudio[(r % 4) + 1] ?? 0;
        const speed = (1 + rect.speed) * channelValue;

        rect.position += rect.speed + speed;

        // Wrap around
        if (rect.position > width / 2) rect.position = -width / 2;

        // Y position based on row index
        const y = i * rowHeight - this.ROW_COUNT * rowHeight / 2;

        // Update instance
        dummy.position.set(rect.position, y, 0);
        dummy.scale.set(rect.size, 1, 1);
        dummy.updateMatrix();

        this.mesh.setMatrixAt(instanceIndex, dummy.matrix);
        instanceIndex++;
      }
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

}