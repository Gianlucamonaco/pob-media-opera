// composables/scene/3d/element.ts
import * as THREE from "three";
import { vertexShader, fragmentShader } from "~/composables/shapes/3d/shaders/circles.glsl"
import type { ElementConfig, InstanceTransform } from "~/data/types";
import { LayoutType, ShapeType } from "~/data/constants";
import { LayoutGenerator } from "./layout";

const dummy = new THREE.Object3D();

/**
 * Takes the abstract Layout data and connects it to a physical Three.js InstancedMesh
 */
export class SceneElement {
  id: string;
  config: ElementConfig;
  data: InstanceTransform[];
  mesh: THREE.InstancedMesh;
  geometry: THREE.BufferGeometry | null = null;
  material: THREE.ShaderMaterial | THREE.MeshStandardMaterial;

  private bounds: THREE.Vector3 = new THREE.Vector3();

  constructor(config: ElementConfig, scene: THREE.Scene) {
    this.id = config.id;
    this.config = config;

    // Generate Layout Data
    const baseData = LayoutGenerator.generate(config.layout);

    // Apply variation
    this.data = baseData.map(transform => this.applyVariation(transform));

    const { shape, style } = this.config;

    // Factory logic for Geometries and Materials
    if (shape === ShapeType.CIRCLES) {
      this.geometry = new THREE.PlaneGeometry(style.size.x, style.size.y);
      this.material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          uColor: { value: new THREE.Color(0x000000) },
          uThickness: { value: style.thickness || 0.05 },
        }
      });
    }
    else {
      this.geometry = new THREE.PlaneGeometry(style.size.x, style.size.y);
      this.material = new THREE.MeshStandardMaterial({ color: style.color || 0x000000, side: THREE.DoubleSide });
    }

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.data.length);
    scene.add(this.mesh);

    this.calculateBounds();
  }

  private applyVariation (transform: InstanceTransform): InstanceTransform {
    const v = this.config.variation;
    const m = this.config.motion;

    // Randomize within the range defined in config
    if (v) {
      transform.position.x += (Math.random() - 0.5) * (v?.position?.x || 0);
      transform.position.y += (Math.random() - 0.5) * (v?.position?.y || 0);
      transform.position.z += (Math.random() - 0.5) * (v?.position?.z || 0);
      
      transform.rotation.x += (Math.random() - 0.5) * (v.rotation?.x || 0);
    }
    
    // Set up unique motion speeds for this specific instance
    if (m) {
      transform.motionSpeed = {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * (v?.speed?.x || 0) + (m?.position?.x || 0),
          (Math.random() - 0.5) * (v?.speed?.y || 0) + (m?.position?.y || 0),
          (Math.random() - 0.5) * (v?.speed?.z || 0) + (m?.position?.z || 0)
        ),
        rotation: new THREE.Vector3(
           (Math.random() + 0.5) * (m?.rotation?.x || 0),
           (Math.random() + 0.5) * (m?.rotation?.y || 0),
           (Math.random() + 0.5) * (m?.rotation?.z || 0)
        )
      };
    }

    return transform;
  }

  private calculateBounds () {
    const { layout } = this.config;
    if (layout.type === LayoutType.GRID && layout.dimensions && layout.spacing) {
      this.bounds.set(
        layout.dimensions.x * layout.spacing.x,
        layout.dimensions.y * layout.spacing.y,
        layout.dimensions.z * layout.spacing.z
      );
    }
  }

  private handleWrap (transform: InstanceTransform) {
    // Only wrap if bounds are defined (greater than 0)
    const halfWidth = this.bounds.x / 2;
    const halfHeight = this.bounds.y / 2;
    const halfDepth = this.bounds.z / 2;

    // X Axis
    if (this.bounds.x > 0) {
      if (transform.position.x > halfWidth) transform.position.x = -halfWidth;
      if (transform.position.x < -halfWidth) transform.position.x = halfWidth;
    }

    // Y Axis
    if (this.bounds.y > 0) {
      if (transform.position.y > halfHeight) transform.position.y = -halfHeight;
      if (transform.position.y < -halfHeight) transform.position.y = halfHeight;
    }

    // Z Axis
    if (this.bounds.z > 0) {
      if (transform.position.z > halfDepth) transform.position.z = -halfDepth;
      if (transform.position.z < -halfDepth) transform.position.z = halfDepth;
    }
  }

  // PHASE 1: PHYSICS (Runs before script)
  updatePhysics() {
    this.data.forEach((t) => {
      // Apply Persistent Motion
      if (t.motionSpeed) {
        t.position.add(t.motionSpeed.position);
        t.rotation.x += t.motionSpeed.rotation.x;
        t.rotation.y += t.motionSpeed.rotation.y;
      }

      // Handle Wrapping (keep it inside the box)
      this.handleWrap(t);

      // Reset Render State to match Physics State
      // This wipes away any audio deformations from the previous frame
      t.renderPosition.copy(t.position);
      t.renderRotation.copy(t.rotation);
      t.renderScale.copy(t.scale);
    });
  }

  // PHASE 3: DRAW (Runs after script)
  draw() {
    this.data.forEach((t, i) => {
      // Use the render properties, which the script might have modified
      dummy.position.copy(t.renderPosition);
      dummy.rotation.copy(t.renderRotation);
      dummy.scale.copy(t.renderScale);
      
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    });

    this.mesh.instanceMatrix.needsUpdate = true;
  }
  
  dispose(scene: THREE.Scene) {
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }

  get uniforms() {
    if (this.mesh.material instanceof THREE.ShaderMaterial) {
      return this.mesh.material.uniforms;
    }
    return null;
  }
}