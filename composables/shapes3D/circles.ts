import * as THREE from "three";
import { use3DScene } from "../state";
import { Base3D } from "./base";
import { mapLinear } from "three/src/math/MathUtils.js";
import { ChannelNames, Scenes } from "~/data/constants";

// A simple shader to draw a sharp ring on a square plane using UVs
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uIndex; // 0 to 3
  uniform float uThickness; // 0.0 to 0.5
  uniform vec4 uThicknesses; // [.0, .0, .0, .0]

  void main() {
    // Calculate distance from center of the UV (0.5, 0.5)
    // vUv is 0,0 top-left and 1,1 bottom-right
    vec2 center = vec2(0.5);
    float dist = distance(vUv, center);

    // Create the ring using step (HARD EDGE, NO GRADIENT)
    // We want pixels where dist is ~ 0.5
    // Outer edge: dist < 0.5
    // Inner edge: dist > (0.5 - thickness)
    
    float outerCircle = step(dist, 0.5);
    float innerCircle = step(dist, 0.5 - uThickness);
    
    // Subtract inner from outer to get the ring
    float ring = outerCircle - innerCircle;

    if (ring < 0.5) discard; // Cut out the empty space
    
    gl_FragColor = vec4(uColor, 1.0);
  }
`;

const dummy = new THREE.Object3D();

export class Circles extends Base3D {
  override mesh: THREE.InstancedMesh;
  override material: THREE.ShaderMaterial;

  count = 50;
  radius = 250;
  thickness = 0.005;
  depth = 1850;
  speed = 1.5;

  // State
  data: { z: number, w: number }[]; 

  constructor(params: any) {
    super(params);
    this.count = params.count ?? 50;
    this.radius = params.radius ?? 250;
    this.thickness = params.thickness ?? 0.005;
    this.depth = params.depth ?? 1850;
    this.speed = params.speed ?? 1.5;

    const { scene } = use3DScene().value;

    // 1. GEOMETRY
    // Use a Plane. Size it roughly to the diameter you want (e.g., 100x100)
    this.geometry = new THREE.PlaneGeometry(this.radius, this.radius);

    // 2. MATERIAL
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false, // Prevents transparency sorting glitches
      uniforms: {
        uColor: { value: new THREE.Color(0x000000) },
        uThickness: { value: this.thickness }, // Thickness ratio (0.05 = thin, 0.2 = thick)
        uThicknesses: { value: [.0, .0, .0, .0] }
      }
    });

    // 3. INSTANCED MESH
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
    
    // Initialize ring positions spread out along Z
    this.data = [];
    const step = this.depth / this.count;

    for (let i = 0; i < this.count; i++) {
      // We start them at negative Z (in front of camera)
      // e.g. -1000, -950, -900 ... 0
      const initialZ = -this.depth/2 - (i * step);
      const w = Math.random();

      this.data.push({ z: initialZ, w });

      // Set initial dummy position
      dummy.position.set(0,0, initialZ);
      dummy.scale.set(w, w, w); 

      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }

    scene?.add(this.mesh);
  }
 
  override update() {
    const { $wsAudio } = useNuxtApp() as any;
    const { title } = useSceneMeta()?.value ?? {};

    let curveTime = performance.now() * 0.0001; // Global time for the sine wave

    // Update separate thickness values
    // this.material.uniforms.uThicknesses!.value = $wsAudio;

    for (let i = 0; i < this.count; i++) {
      let loudness;
      const ring = this.data[i] ?? { z: 0 };
      const ch = $wsAudio[(i % 4) + 1];
      const ch4 = $wsAudio[ChannelNames.CH_1_DRUMS];

      // 1. Move Forward (towards +Z)
      ring.z += this.speed;

      // 2. Reset Logic
      // If ring passes the camera (z > 0), send it to the back of the line
      if (ring.z > this.depth/2) {
        ring.z = -this.depth/2;
      }

      // 3. Calculate Curve (The "Snake" Effect)
      // We use the ring's Z position to determine where it should be in X/Y
      // This makes the curve look like it's static and we are traveling through it
      let curveIntensity = 0; // How wide the curve is
      let curveFreq = 0;     // How frequent the turns are
      let curveGap = 0;

      if (title) {
        switch (title) {
          case Scenes.GHOSTSSS: {
            loudness = ch.loudness ?? 0;
            curveTime = performance.now() * 0.0001 + 0.5 * loudness;
            curveIntensity = 10 + 2.5 * loudness;
            curveFreq = 0.0125 * (i%4) + 0.005 * loudness;

            this.material.uniforms.uThickness!.value = mapLinear(ch4.loudness, 0, 1, 0.05, 0.1);
            break;
          }
          case Scenes.ESGIBTBROT: {
            loudness = ch.loudness ?? 0;
            curveTime = performance.now() * 0.001;
            curveIntensity = 25 + 5 * loudness;
            curveFreq = 0.0025;
            curveGap = 0.01 * loudness;
            break;
          }
        }
      }


      // Calculate offsets
      const x = Math.sin(ring.z * curveFreq + curveTime) * curveIntensity;
      const y = Math.cos(ring.z * curveFreq * 0.5 + curveTime) * curveIntensity;
      const w = Math.max(0.01, (ring.z + this.depth/2) / this.depth) + curveGap;

      // 4. Update Matrix
      dummy.position.set(x, y, ring.z);
      
      // Optional: Rotate ring to face the curve direction (makes it look 3D)
      dummy.lookAt(x, y, ring.z + 10); 
      
      // Ensure scale is 1,1,1 (scaling causes thickness distortion)
      // dummy.scale.set(1, 1, 1); 
      dummy.scale.set(w, w, 1); 

      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }
}