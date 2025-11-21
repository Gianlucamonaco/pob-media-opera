import * as THREE from "three";
import { use3DScene } from "../general";
import { Base } from "./base";

let dummy = new THREE.Object3D();

export class Rectangles extends Base {
  data: { position: { x?: number, y?: number, z?: number }; size: { x?: number, y?: number }; speed: number }[][];
  rectW = 30;
  rectH = 30;
  rows = 30;
  columns = 8;

  constructor(params: any) {
    super(params)

    const scene = use3DScene();
    const instanceCount = this.rows * this.columns;

    // Create instances
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.material = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, instanceCount);

    // Set initial position
    for (let i = 0; i < instanceCount; i++) {
      dummy.position.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }

    // Add instances to the scene
    scene.value?.add(this.mesh);

    // Set data (MITTERGRIES)
    this.data = Array.from(
      { length: this.rows },
      (_, i) =>
        Array.from({ length: this.columns }, () => ({
          position: {
            x: window?.innerWidth ? (Math.random() - 0.5) * window.innerWidth : 0,
            y: this.rows * this.rectH * -0.5 + this.rectH * i,
            z: 0, //(Math.random() - 0.5) * 50,
          },
          size: {
            x: this.rectW + Math.random() * 60,
            y: this.rectH,
          },
          speed: 0.05 + Math.random() * 0.15,
        }))
    );

  }

  override update () {
    if (!window?.innerWidth) return;

    const { $wsAudio } = useNuxtApp() as any;

    const width = window.innerWidth;

    let instanceIndex = 0; // for the instanced mesh

    for (let i = 0; i < this.rows; i++) {
      const row = this.data[i];

      for (let r = 0; r < this.columns; r++) {
        const rect = row?.[r] as any;

        const channelValue = $wsAudio[(i % 4) + 1][0] ?? 0;
        const speed = (1 + rect.speed) * channelValue;

        rect.position.x += rect.speed + speed;

        // Wrap around
        if (rect.position.x > width / 2) rect.position.x = -width / 2;

        // Update instance
        dummy.position.set(rect.position.x, rect.position.y, rect.position.z);
        dummy.scale.set(rect.size.x, rect.size.y, 1);
        dummy.updateMatrix();

        this.mesh.setMatrixAt(instanceIndex, dummy.matrix);
        instanceIndex++;
      }
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

}