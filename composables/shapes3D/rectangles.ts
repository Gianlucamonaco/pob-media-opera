import * as THREE from "three";
import { use3DScene } from "../general";
import { Base3D } from "./base";

let dummy = new THREE.Object3D();

export class Rectangles extends Base3D {
  data: { position: { x?: number, y?: number, z?: number }; size: { x?: number, y?: number }; speed: number }[][];
  rows: number;
  columns: number;
  rectW: number;
  rectH: number;
  rectVariation: number;
  gapX: number;
  gapY: number;
  speed: number;

  constructor(params: any) {
    super(params)
    this.rows = params.rows ?? 30;
    this.columns = params.columns ?? 8;
    this.rectW = params.rectW ?? 30;
    this.rectH = params.rectH ?? 30;
    this.rectVariation = params.rectVariation ?? 0;
    this.gapX = params.gapX ?? 0;
    this.gapY = params.gapY ?? 0;
    this.speed = params.speed ?? 0.05;

    const { scene } = use3DScene().value;
    const instanceCount = this.rows * this.columns;

    // Create instances
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.material = new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.DoubleSide });

    this.material.onBeforeCompile = (shader) => {
      shader.vertexShader = `
        attribute float instanceVisible;
        varying float vVisible;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
          #include <begin_vertex>
          vVisible = instanceVisible;
        `
      );

      shader.fragmentShader = `
        varying float vVisible;
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
          if (vVisible < 0.5) discard;
          #include <dithering_fragment>
        `
      );
    };

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, instanceCount);

    // Set initial position
    for (let i = 0; i < instanceCount; i++) {
      dummy.position.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }

    // Add instances to the scene
    scene?.add(this.mesh);

    // Set data (MITTERGRIES)
    this.data = Array.from(
      { length: this.rows },
      (_, i) =>
        Array.from({ length: this.columns }, (_, c) => ({
          position: {
            x: this.columns * (this.rectW + this.rectVariation + this.gapX * Math.random()) * -0.5 + (this.rectW + this.rectVariation + this.gapX * Math.random()) * c,
            y: this.rows * (this.rectH + this.gapY) * -0.5 + (this.rectH + this.gapY) * i,
            z: (Math.random() - 0.5) * 50,
          },
          size: {
            x: this.rectW + this.rectVariation * Math.random(),
            y: this.rectH,
          },
          rotation: {
            z: useSceneTitle().value == 'RFBongos' ? Math.random() * Math.PI : 0,
          },
          speed: this.speed + Math.random() * this.speed,
        }))
    );

    // Create a Float32 visibility array
    const visibilityArray = new Float32Array(instanceCount);

    let idx = 0;
    for (let row of this.data) {
      for (let cell of row) {
        visibilityArray[idx++] = 0;
      }
    }

    this.mesh.geometry.setAttribute(
      'instanceVisible',
      new THREE.InstancedBufferAttribute(visibilityArray, 1)
    );
  }

  setInstanceVisibility (row: number, col: number, visible: boolean) {
    if (!this.mesh.geometry.attributes.instanceVisible) return;
    const index = row * this.columns + col;

    this.mesh.geometry.attributes.instanceVisible.setX(index, visible ? 1 : 0);
    this.mesh.geometry.attributes.instanceVisible.needsUpdate = true;
  }

  setVisibility (visible: boolean) {
    if (!this.mesh.geometry.attributes.instanceVisible) return;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        const index = row * this.columns + col;
        this.mesh.geometry.attributes.instanceVisible.setX(index, visible ? 1 : 0);
        this.mesh.geometry.attributes.instanceVisible.needsUpdate = true;
      }
    }    
  }

  override update () {
    if (!window?.innerWidth) return;

    const { $wsAudio } = useNuxtApp() as any;

    const maxWidth = (this.rectW + this.rectVariation + this.gapX) * this.columns;

    let instanceIndex = 0; // for the instanced mesh

    for (let i = 0; i < this.rows; i++) {
      const row = this.data[i];

      for (let r = 0; r < this.columns; r++) {
        const rect = row?.[r] as any;

        const channelValue = $wsAudio[(i % 4) + 1][0] ?? 0;
        const speed = rect.speed * channelValue;

        rect.position.x += rect.speed + speed;

        // Wrap around
        if (rect.position.x > maxWidth / 2) rect.position.x = -maxWidth / 2;

        // Update instance
        dummy.position.set(rect.position.x, rect.position.y, rect.position.z);
        dummy.scale.set(rect.size.x, rect.size.y, 1);
        dummy.rotation.set(0, 0, rect.rotation.z);
        dummy.updateMatrix();

        this.mesh.setMatrixAt(instanceIndex, dummy.matrix);
        instanceIndex++;
      }
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

}