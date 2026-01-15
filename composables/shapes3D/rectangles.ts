import * as THREE from "three";
import { use3DScene } from "../state";
import { Base3D } from "./base";
import { ChannelNames, Scenes } from "~/data/constants";
import { mapLinear } from "three/src/math/MathUtils.js";
import type { ShapeMotion, ShapeVariation, Vector2, Vector3 } from "~/data/types";

let dummy = new THREE.Object3D();

export class Rectangles extends Base3D {
  data: RectData[] | undefined;
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

    const { scene } = use3DScene().value;
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
            y: this.size.y,
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

    for (let index = 0; index < this.gridRows * this.gridColumns; index++) {
      this.mesh.geometry.attributes.instanceVisible.setX(index, visible ? 1 : 0);
      this.mesh.geometry.attributes.instanceVisible.needsUpdate = true;
    }    
  }

  override update () {
    if (!window?.innerWidth || !this.data) return;

    const { $wsAudio } = useNuxtApp() as any;
    const { title } = useSceneMeta()?.value ?? {};

    let animTime = performance.now() * 0.0002; // Global time for the animation

    const maxWidth = (this.size.x + this.variation.size.x + this.gap.x) * this.gridColumns;
    const maxHeight = (this.size.y + this.variation.size.y + this.gap.y) * this.gridRows;

    let instanceIndex = 0; // for the instanced mesh

    // --------------------------------
    // HANDLE VISIBILITY
    // --------------------------------

    if (title) {
      switch (title) {

        case Scenes.RFBONGOS: {
          // DRUMS.onOff: Trigger elements visibility (only 1-5 at a time)
          // DRUMS.loudness: Number of elements visible

          const { onOff, loudness } = $wsAudio[ChannelNames.PB_CH_1_DRUMS];
          const onOffPrevCount = this.onOffCount;

          if (this.onOffPrevState == 0 && onOff == 1) {
            this.onOffPrevState = 1;
            this.onOffCount++;
          }

          // Hide all elements When on/off is 0
          else if (this.onOffPrevState == 1 && onOff == 0) {
            this.onOffPrevState = 0;
            this.setVisibility(false);
          }

          // Show new elements every time the on/off count increases
          if (this.onOffCount > onOffPrevCount) {
            const count = Math.floor(loudness * 4 + (2 * Math.random()));

            for (let i = 0; i < count; i++) {
              const index = Math.round(this.gridColumns * this.gridRows * Math.random());
              this.setInstanceVisibility(index, true);          
            }
          }
        }
      }
    }

    // --------------------------------
    // HANDLE TRANSFORMATIONS
    // --------------------------------

    for (let i = 0; i < this.gridRows * this.gridColumns; i++) {
      let loudness;
      const rect = this.data[i] as RectData;
      const ch = $wsAudio[(i % 4) + 1];

      // Apply transformation
      rect.position.x += rect.motion.position.x;
      rect.position.y += rect.motion.position.y;
      rect.position.z += rect.motion.position.z;

      rect.rotation.x += rect.motion.rotation.x;
      rect.rotation.y += rect.motion.rotation.y;
      rect.rotation.z += rect.motion.rotation.z;

      if (title) {
        switch (title) {
          case Scenes.MITTERGRIES: {
            // DRUMS.onOff: Trigger elements visibility (only 1-5 at a time)
            // DRUMS.loudness: Number of elements visible
            
            const { pitch } = $wsAudio[ChannelNames.PB_CH_3_HARMONIES];

            // if (i == 0) console.log(mapLinear(pitch, 0, 1, 1, 100));
            
            loudness = ch.loudness ?? 0;
            rect.position.x += rect.motion.position.x * loudness;
            rect.position.y += rect.motion.position.y * loudness;
            rect.position.z = mapLinear(pitch, 0, 1, -10, 10);
            break;
          }
          case Scenes.DATASET: {
            loudness = ch.loudness ?? 0;
            rect.position.y = rect.position.y + Math.sin(animTime + (i*Math.PI/4)) * 0.05;

            rect.rotation.x += rect.motion.rotation.x * (-1 + loudness * 10);
            rect.rotation.y += rect.motion.rotation.y * (-1 + loudness * 10);
            rect.rotation.z += rect.motion.rotation.z * (-1 + loudness * 10);
            break;
          }
          case Scenes.RFBONGOS: {
            loudness = $wsAudio[ChannelNames.PB_CH_1_DRUMS].loudness;
            rect.position.z = mapLinear(loudness, 0, 1, -50, 50);
          }
        }
      }


      // Wrap around
      if (rect.position.x >  maxWidth / 2)  rect.position.x = -maxWidth / 2;
      if (rect.position.x < -maxWidth / 2)  rect.position.x = maxWidth / 2;
      if (rect.position.y >  maxHeight / 2) rect.position.y = -maxHeight / 2;
      if (rect.position.y < -maxHeight / 2) rect.position.y = maxHeight / 2;

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
  motion: {
    position: { x: number; y: number; z: number; };
    rotation: { x: number; y: number; z: number; };
  }
}