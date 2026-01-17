import * as THREE from "three";
import { useScene3D } from "~/composables/state";
import { addShaderVisibilityAttribute } from "~/composables/utils/three";
import type { RectData, ShapeMotion, ShapeVariation, Vector2, Vector3 } from "~/data/types";
import { Base3D } from "./base";

let dummy = new THREE.Object3D();

export class Rectangles extends Base3D {
  public data: RectData[] = [];
  gridRows: number;
  gridColumns: number;
  size: Vector2;
  gap: Vector3;
  rotation: Vector3;
  variation: ShapeVariation;
  motion: ShapeMotion;

  progress = 0;
  onOffCount = 0;
  onOffPrevState = 0;

  constructor(params: any) {
    super(params)
    this.gridRows = params.gridRows ?? 30;
    this.gridColumns = params.gridColumns ?? 8;
    this.size = params.size ?? { x: 1, y: 1 };
    this.gap = params.gap ?? { x: 0, y: 0 };
    this.rotation = params.rotation ?? { x: 0, y: 0, z: 0 };
    this.variation = params.variation ?? {
      size: { x: 0, y: 0 },
      position: { x: 0, y: 0, z: 0 },
      gap: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    };
    this.motion = params.motion ?? {
      size: { x: 0, y: 0 },
      position: { x: 0, y: 0, z: 0 },
      gap: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    };

    const { scene } = useScene3D().value ?? {};
    const instanceCount = this.gridRows * this.gridColumns;

    // Create instances
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.material = new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.DoubleSide });
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, instanceCount);

    // This adds the `instanceVisible` attribute to control single instance visibility
    addShaderVisibilityAttribute(this.material, this.mesh, instanceCount);

    // Set initial position
    for (let i = 0; i < instanceCount; i++) {
      dummy.position.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }

    // Add instances to the scene
    scene?.add(this.mesh);

    this.setData();
  }

  setData () {
    // Grid
    this.data = Array.from({ length: this.gridColumns * this.gridRows }, (_, i) => {

      const position = this.getPosition({ type: 'grid', index: i }) ?? { x: 0, y: 0, z: 0 };

      return {
          position,
          size: {
            x: this.size.x + this.variation.size.x * Math.random(),
            y: this.size.y + this.variation.size.y * Math.random(),
          },
          rotation: {
            x: this.variation.rotation.x * Math.random(),
            y: this.variation.rotation.y * Math.random(),
            z: this.variation.rotation.z * Math.random(),
          },
          motion: {
            position: {
              x: this.motion.position?.x ? this.motion.position.x : 0, //  * (0.5 + Math.random())
              y: this.motion.position?.y ? this.motion.position.y : 0, //  * (0.5 + Math.random())
              z: this.motion.position?.z ? this.motion.position.z : 0, //  * (0.5 + Math.random())
            },
            rotation: {
              x: this.motion.rotation?.x ? this.motion.rotation.x : 0, //  * (0.5 + Math.random())
              y: this.motion.rotation?.y ? this.motion.rotation.y : 0, //  * (0.5 + Math.random())
              z: this.motion.rotation?.z ? this.motion.rotation.z : 0, //  * (0.5 + Math.random())
            },
          }
        }
      })    
  }

  getPosition = ({ type, index }: { type: string, index: number }) => {
    switch (type) {
      case 'grid': {
        const c = index % this.gridColumns;
        const r = Math.floor(index / this.gridColumns);

        return ({
          x:
            ( this.size.x +
              this.variation.size.x * Math.random() +
              this.gap.x +
              this.variation.gap.x * Math.random()
            ) * (
              this.gridColumns * -0.5 + c +
              this.variation.gap.x * Math.random() * 0.2
            ),
          y:
            ( this.size.y +
              this.variation.size.y * Math.random() +
              this.gap.y +
              this.variation.gap.y * Math.random()
            ) * (
              this.gridRows * -0.5 + r +
              this.variation.gap.y * Math.random() * 0.2 // Add an extra random
            ),
          z: this.gap.z + this.variation.gap.z * Math.random()
        })
      }
    }
  }


  setInstanceVisibility (index: number, visible: boolean) {
    if (!this.mesh.geometry.attributes.instanceVisible) return;

    this.mesh.geometry.attributes.instanceVisible.setX(index, visible ? 1 : 0);
    this.mesh.geometry.attributes.instanceVisible.needsUpdate = true;
  }

  setVisibility (visible: boolean) {
    if (!this.mesh.geometry.attributes.instanceVisible) return;

    for (let index = 0; index < this.data.length; index++) {
      this.mesh.geometry.attributes.instanceVisible.setX(index, visible ? 1 : 0);
      this.mesh.geometry.attributes.instanceVisible.needsUpdate = true;
    }    
  }

  override update() {
    if (!this.data.length) return;

    const maxWidth = (this.size.x + this.variation.size.x + this.gap.x) * this.gridColumns;
    const maxHeight = (this.size.y + this.variation.size.y + this.gap.y) * this.gridRows;

    for (let i = 0; i < this.data.length; i++) {
      const rect = this.data[i];
      if (!rect) continue;

      // 1. Generic Physics (Always happens)
      rect.position.x += rect.motion.position.x;
      rect.position.y += rect.motion.position.y;
      rect.position.z += rect.motion.position.z;

      rect.rotation.x += rect.motion.rotation.x;
      rect.rotation.y += rect.motion.rotation.y;
      rect.rotation.z += rect.motion.rotation.z;

      // Wrap around
      if (rect.position.x >  maxWidth / 2)  rect.position.x = -maxWidth / 2;
      if (rect.position.x < -maxWidth / 2)  rect.position.x = maxWidth / 2;
      if (rect.position.y >  maxHeight / 2) rect.position.y = -maxHeight / 2;
      if (rect.position.y < -maxHeight / 2) rect.position.y = maxHeight / 2;

      // 2. Map Data to Three.js Matrix
      dummy.position.set(rect.position.x, rect.position.y, rect.position.z);
      dummy.scale.set(rect.size.x, rect.size.y, 1);
      dummy.rotation.set(rect.rotation.x, rect.rotation.y, rect.rotation.z);
      dummy.updateMatrix();

      this.mesh.setMatrixAt(i, dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }
  
}

