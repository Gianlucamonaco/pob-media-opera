import * as THREE from "three";
import { use3DScene } from "../state";
import { Base3D } from "./base";
import { ChannelNames, Scenes } from "~/data/constants";
import { mapLinear } from "three/src/math/MathUtils.js";

let dummy = new THREE.Object3D();

export class Rectangles extends Base3D {
  data: RectData[] | undefined;
  rows: number;
  columns: number;
  size: { x: number, y: number };
  gap: { x: number, y: number, z: number };
  rotation: { x: number, y: number, z: number };
  range: {
    size: { x: number, y: number },
    position: { x: number, y: number, z: number }
    gap: { x: number, y: number, z: number }
    rotation: { x: number, y: number, z: number }
  };
  speed: {
    size?: { x: number, y: number },
    position?: { x: number, y: number, z: number }
    gap?: { x: number, y: number, z: number }
    rotation?: { x: number, y: number, z: number }
  };

  progress = 0;
  onOffCount = 0;
  onOffPrevState = 0;

  constructor(params: any) {
    super(params)
    this.rows = params.rows ?? 30;
    this.columns = params.columns ?? 8;
    this.size = params.size ?? { x: 1, y: 1 };
    this.gap = params.gap ?? { x: 0, y: 0 };
    this.rotation = params.rotation ?? { x: 0, y: 0, z: 0 };
    this.range = params.range ?? {
      size: { x: 0, y: 0 },
      position: { x: 0, y: 0, z: 0 },
      gap: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    };
    this.speed = params.speed ?? {
      size: { x: 0, y: 0 },
      position: { x: 0, y: 0, z: 0 },
      gap: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    };

    const { scene } = use3DScene().value;
    const instanceCount = this.rows * this.columns;

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
    this.data = Array.from({ length: this.columns * this.rows }, (_, i) => {

      const position = this.getPosition({ type: 'grid', index: i }) ?? { x: 0, y: 0, z: 0 };

      return {
          position,
          size: {
            x: this.size.x + this.range.size.x * Math.random(),
            y: this.size.y,
          },
          rotation: {
            x: this.range.rotation.x * Math.random(),
            y: this.range.rotation.y * Math.random(),
            z: this.range.rotation.z * Math.random(),
          },
          speed: {
            position: {
              x: this.speed.position?.x ? this.speed.position.x : 0, //  * (0.5 + Math.random())
              y: this.speed.position?.y ? this.speed.position.y : 0, //  * (0.5 + Math.random())
              z: this.speed.position?.z ? this.speed.position.z : 0, //  * (0.5 + Math.random())
            },
            rotation: {
              x: this.speed.rotation?.x ? this.speed.rotation.x : 0, //  * (0.5 + Math.random())
              y: this.speed.rotation?.y ? this.speed.rotation.y : 0, //  * (0.5 + Math.random())
              z: this.speed.rotation?.z ? this.speed.rotation.z : 0, //  * (0.5 + Math.random())
            },
          }
        }
      })    
  }

  getPosition = ({ type, index }: { type: string, index: number }) => {
    switch (type) {
      case 'grid': {
        const c = index % this.columns;
        const r = Math.floor(index / this.columns);

        return ({
          x:
            ( this.size.x +
              this.range.size.x * Math.random() +
              this.gap.x +
              this.range.gap.x * Math.random()
            ) * (
              this.columns * -0.5 + c +
              this.range.gap.x * Math.random() * 0.2
            ),
          y:
            ( this.size.y +
              this.range.size.y * Math.random() +
              this.gap.y +
              this.range.gap.y * Math.random()
            ) * (
              this.rows * -0.5 + r +
              this.range.gap.y * Math.random() * 0.2 // Add an extra random
            ),
          z: this.gap.z + this.range.gap.z * Math.random()
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

    for (let index = 0; index < this.rows * this.columns; index++) {
      this.mesh.geometry.attributes.instanceVisible.setX(index, visible ? 1 : 0);
      this.mesh.geometry.attributes.instanceVisible.needsUpdate = true;
    }    
  }

  override update () {
    if (!window?.innerWidth || !this.data) return;

    const { $wsAudio } = useNuxtApp() as any;
    const { title } = useSceneMeta()?.value ?? {};

    let animTime = performance.now() * 0.0002; // Global time for the animation

    const maxWidth = (this.size.x + this.range.size.x + this.gap.x) * this.columns;
    const maxHeight = (this.size.y + this.range.size.y + this.gap.y) * this.rows;

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
              const index = Math.round(this.columns * this.rows * Math.random());
              this.setInstanceVisibility(index, true);          
            }
          }
        }
      }
    }

    // --------------------------------
    // HANDLE TRANSFORMATIONS
    // --------------------------------

    for (let i = 0; i < this.rows * this.columns; i++) {
      let loudness;
      const rect = this.data[i] as RectData;
      const ch = $wsAudio[(i % 4) + 1];

      // Apply transformation
      rect.position.x += rect.speed.position.x;
      rect.position.y += rect.speed.position.y;
      rect.position.z += rect.speed.position.z;

      rect.rotation.x += rect.speed.rotation.x;
      rect.rotation.y += rect.speed.rotation.y;
      rect.rotation.z += rect.speed.rotation.z;

      if (title) {
        switch (title) {
          case Scenes.MITTERGRIES: {
            // DRUMS.onOff: Trigger elements visibility (only 1-5 at a time)
            // DRUMS.loudness: Number of elements visible
            
            const { pitch } = $wsAudio[ChannelNames.PB_CH_3_HARMONIES];

            if (i == 0) console.log(mapLinear(pitch, 0, 1, 1, 100));
            
            loudness = ch.loudness ?? 0;
            rect.position.x += rect.speed.position.x * loudness;
            rect.position.y += rect.speed.position.y * loudness;
            rect.position.z = mapLinear(pitch, 0, 1, -10, 10);
            break;
          }
          case Scenes.DATASET: {
            loudness = ch.loudness ?? 0;
            rect.position.y = rect.position.y + Math.sin(animTime + (i*Math.PI/4)) * 0.05;

            rect.rotation.x += rect.speed.rotation.x * (-1 + loudness * 10);
            rect.rotation.y += rect.speed.rotation.y * (-1 + loudness * 10);
            rect.rotation.z += rect.speed.rotation.z * (-1 + loudness * 10);
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
  speed: {
    position: { x: number; y: number; z: number; };
    rotation: { x: number; y: number; z: number; };
  }
}