import * as THREE from "three";
import { Scenes } from "~/data/constants";
import { useScene3D } from "~/composables/state";
import { shuffle } from "~/composables/utils/array";
import { addShaderVisibilityAttribute } from "~/composables/utils/three";
import { Base3D } from "./base";
import type { Rectangles } from "./rectangles";
import type { Circles } from "./circles";

let dummy = new THREE.Object3D();

export class Connections extends Base3D {
  data: any;
  count: number;
  size: { x: number, y: number };
  ref: Rectangles | Circles | null;

  progress = 0;

  constructor(params: any) {
    super(params)
    this.count = params?.count ?? 200;
    this.size = params?.size ?? { x: 100, y: 0.1 };
    this.ref = null;

    const { scene } = useScene3D().value ?? {};

    // Create instances
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.material = new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.DoubleSide });
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);

    // This adds the `instanceVisible` attribute to control single instance visibility
    addShaderVisibilityAttribute(this.material, this.mesh, this.count);

    // Set initial position
    for (let i = 0; i < this.count; i++) {
      dummy.position.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }

    // Add instances to the scene
    scene?.add(this.mesh);
  }

  // Set the shapes to be connected
  setRef (ref: Rectangles | Circles | null) {
    this.ref = ref;

    if (ref) {
      this.setData();
    }
  }

  setData () {
    if (!this.ref?.data) return;

    
    this.data = this.computeConnections(this.ref.data);
  }

  computeConnections (points: any) {
    const connections = [];

    shuffle(points);

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i].position;
      const p2 = points[i + 1].position;

      // Vector differences
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dz = p2.z - p1.z;

      // Length of the segment
      const length = Math.sqrt(dx*dx + dy*dy + dz*dz);

      // Midpoint
      const mid = {
        x: p1.x + dx * 0.5,
        y: p1.y + dy * 0.5,
        z: p1.z + dz * 0.5
      };

      // Compute rotation to align an object with the segment
      const rotation = this.computeRotationFromVector(dx, dy, dz);

      // Final connection object
      connections.push({
        position: mid,
        size: { x: length, y: 0.1, z: 0.1 },  // you can use only x if needed
        rotation
      });
    }

    return connections;
  }

  computeRotationFromVector (dx: number, dy: number, dz: number) {
    // Normalize vector
    const length = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (length === 0) return { x: 0, y: 0, z: 0 };

    const nx = dx / length;
    const ny = dy / length;
    const nz = dz / length;

    // Rotation to align with X axis:
    // yaw around Y, pitch around Z
    const yaw   = -Math.atan2(nz, nx); // rotation around Y
    const pitch = Math.atan2(ny, Math.sqrt(nx*nx + nz*nz)); // rotation around Z

    return {
      x: 0,
      y: yaw,
      z: pitch
    };
  }

  setInstanceVisibility (index: number, visible: boolean) {
    if (!this.mesh.geometry.attributes.instanceVisible) return;

    this.mesh.geometry.attributes.instanceVisible.setX(index, visible ? 1 : 0);
    this.mesh.geometry.attributes.instanceVisible.needsUpdate = true;
  }

  setVisibility (visible: boolean) {
    if (!this.mesh.geometry.attributes.instanceVisible) return;

    for (let index = 0; index < this.count; index++) {
      this.mesh.geometry.attributes.instanceVisible.setX(index, visible ? 1 : 0);
      this.mesh.geometry.attributes.instanceVisible.needsUpdate = true;
    }    
  }

  override update () {
    if (!window?.innerWidth || !this.data) return;

    const { $wsAudio } = useNuxtApp() as any;
    const { title } = useSceneMeta()?.value ?? {};

    let animTime = performance.now() * 0.0002; // Global time for the animation

    let instanceIndex = 0; // for the instanced mesh

    for (let i = 0; i < this.count; i++) {
      const rect = this.data[i] as RectData;
      // const channelValue = $wsAudio[(i % 4) + 1][0] ?? 0;

      if (title) {
        switch (title) {
          case Scenes.LIKE_NOTHING: {
            // rect.position.y = rect.position.y + Math.sin(animTime + (i*Math.PI/4)) * 0.05;

            // rect.rotation.x += 0;
            // rect.rotation.y += 0;
            // rect.rotation.z += 0;
            break;
          }
        }
      }

      // Update instance
      dummy.position.set(rect.position.x, rect.position.y, rect.position.z);
      dummy.scale.set(rect.size.x, rect.size.y, 1);
      dummy.rotation.set(rect.rotation.x, rect.rotation.y, rect.rotation.z);
      dummy.updateMatrix();

      this.mesh.setMatrixAt(instanceIndex, dummy.matrix);
      instanceIndex++;
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    this.progress++;
  }
  
}

type RectData = {
  position: { x: number; y: number; z: number; };
  rotation: { x: number; y: number; z: number; };
  size: { x: number; y: number; };
}