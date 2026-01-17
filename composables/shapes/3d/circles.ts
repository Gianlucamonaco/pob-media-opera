import * as THREE from "three";
import { useScene3D } from "~/composables/state";
import { vertexShader, fragmentShader } from "./shaders/circles.glsl";
import { Base3D } from "./base";

const dummy = new THREE.Object3D();

export class Circles extends Base3D {
  override mesh: THREE.InstancedMesh;
  override material: THREE.ShaderMaterial;

  count = 50;
  radius = 250;
  depth = 1850;
  motion = 1.5;

  // Public state for scripts to manipulate
  data: { x: number; y: number; z: number; w: number }[] = [];

  constructor(params: any) {
    super(params);
    this.count = params.count ?? 50;
    this.radius = params.radius ?? 250;
    this.depth = params.depth ?? 1850;
    this.motion = params.motion ?? 1.5;

    const { scene } = useScene3D().value ?? {};

    this.geometry = new THREE.PlaneGeometry(this.radius, this.radius);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false, // Prevents transparency sorting glitches
      uniforms: {
        uColor: { value: new THREE.Color(0x000000) },
        uThickness: { value: params.thickness ?? 0.05 }, // Thickness ratio (0.05 = thin, 0.2 = thick)
      }
    });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
    
    // Initial distribution along Z axis
    const step = this.depth / this.count;
    for (let i = 0; i < this.count; i++) {
      const z = - (i * step); // -this.depth / 2 
      this.data.push({ x: 0, y: 0, z, w: 1 });
    }

    scene?.add(this.mesh);
  }
 
  override update() {
    for (let i = 0; i < this.count; i++) {
      const ring = this.data[i];
      if (!ring) return;

      // 1. Constant Tunnel Motion
      ring.z += this.motion;

      // 2. Wrap Around Logic
      if (ring.z > this.depth / 2) {
        ring.z = -this.depth / 2;
      }

      // 3. Apply Transforms to Matrix
      dummy.position.set(ring.x, ring.y, ring.z);
      dummy.scale.set(ring.w, ring.w, 1);
      
      // Face the camera path
      dummy.lookAt(ring.x, ring.y, ring.z + 10); 
      
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }
}