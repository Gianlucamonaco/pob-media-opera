import * as THREE from "three";
import { vertexShader, fragmentShader } from "~/composables/shapes/3d/shaders/circles.glsl"
import type { ElementConfig, InstanceTransform } from "~/data/types";
import { LayoutType, ShapeType } from "~/data/constants";
import { LayoutGenerator } from "./layout";
import { useSceneBridge } from "~/composables/scene/bridge";
import { addShaderVisibilityAttribute } from "~/composables/utils/three";
import { chance, random, randomInt } from "~/composables/utils/math";

const dummy = new THREE.Object3D();
const worldPos = new THREE.Vector3();
const dummyPos = new THREE.Vector3();
const radialDir = new THREE.Vector3();

/**
 * Takes the abstract Layout data and connects it to a physical Three.js InstancedMesh
 */
export class SceneElement {
  id: string;
  container: THREE.Object3D;
  config: ElementConfig;
  data: InstanceTransform[];
  mesh: THREE.InstancedMesh;
  geometry: THREE.BufferGeometry | null = null;
  material: THREE.ShaderMaterial | THREE.MeshBasicMaterial;
  camera: THREE.PerspectiveCamera;

  private bounds: THREE.Vector3 = new THREE.Vector3();

  constructor(config: ElementConfig, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.id = config.id;
    this.config = config;
    this.camera = camera;
    this.container = new THREE.Object3D();

    // Set the instance container
    const origin = config.layout.origin;
    this.container.position.set(origin.x, origin.y, origin.z);
  
    if (config.layout.rotation) {
      this.container.rotation.set(config.layout.rotation.x, config.layout.rotation.y, config.layout.rotation.z);
    }

    // Generate Layout Data
    const baseData = LayoutGenerator.generate(config.layout);

    // Apply variation
    this.data = baseData.map(transform => this.applyVariation(transform));

    const { shape, style } = this.config;

    // Factory logic for Geometries and Materials
    if (shape === ShapeType.CIRCLE) {
      this.geometry = new THREE.PlaneGeometry(style.size.x, style.size.y);
      this.material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          uColor: { value: new THREE.Color(style.color || 0x000000) },
          uThickness: { value: style.thickness || 0.05 },
        }
      });
    }
    else {
      this.geometry = new THREE.PlaneGeometry(style.size.x, style.size.y);
      this.material = new THREE.MeshBasicMaterial({ color: style.color || 0x000000, side: THREE.DoubleSide });
    }

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.data.length);

    // Add the `instanceVisible` attribute to control single instance visibility
    if (this.material instanceof THREE.MeshBasicMaterial) {
      addShaderVisibilityAttribute(this.material, this.mesh, this.data.length);
    }

    this.container.add(this.mesh);
    scene.add(this.container);

    this.calculateBounds();
  }

  private applyVariation (transform: InstanceTransform): InstanceTransform {
    const rot = this.config.style.rotation;
    const v = this.config.variation;
    const m = this.config.motion;

    if (rot) {
      transform.rotation.x += rot.x;
      transform.rotation.y += rot.y;
      transform.rotation.z += rot.z;
    }

    // Randomize within the range defined in config
    if (v) {
      transform.scale.x += (Math.random() - 0.5) * (v?.scale?.x || 0);
      transform.scale.y += (Math.random() - 0.5) * (v?.scale?.y || 0);
      transform.scale.z += (Math.random() - 0.5) * (v?.scale?.z || 0);
      
      transform.position.x += (Math.random() - 0.5) * (v?.position?.x || 0);
      transform.position.y += (Math.random() - 0.5) * (v?.position?.y || 0);
      transform.position.z += (Math.random() - 0.5) * (v?.position?.z || 0);
      
      transform.rotation.x += (Math.random() - 0.5) * (v.rotation?.x || 0);
      transform.rotation.y += (Math.random() - 0.5) * (v.rotation?.y || 0);
      transform.rotation.z += (Math.random() - 0.5) * (v.rotation?.z || 0);
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
        ),
        scale: new THREE.Vector3(
          (m?.scale?.x || 0),
          (m?.scale?.y || 0),
          (m?.scale?.z || 0)
        ),
        radial: (m?.radial || 0),
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
    else if (layout.type === LayoutType.FLOCK && layout.dimensions) {
      this.bounds.set(
        layout.dimensions.x,
        layout.dimensions.y,
        layout.dimensions.z,
      );
    }
    else if (layout.type === LayoutType.SPHERE && layout.radius) {
      this.bounds.set(
        layout.radius,
        layout.radius,
        layout.radius,
      );
    }
  }

  private handleWrap (transform: InstanceTransform) {
    const { motion } = this.config;
    const radialSpeed = motion?.radial || 0;

    // Only wrap if bounds are defined (greater than 0)
    const halfWidth = this.bounds.x / 2;
    const halfHeight = this.bounds.y / 2;
    const halfDepth = this.bounds.z / 2;

    // 1. RADIAL WRAPPING: Reset to center
    if (radialSpeed > 0) {
      const maxDistSq = Math.max(halfWidth, halfHeight, halfDepth) ** 2;
      if (transform.position.lengthSq() > maxDistSq) {
        transform.position.set(0, 0, 0);
        return;
      }
    }
    else if (radialSpeed < 0) {
      if (transform.position.lengthSq() < 0.01) {
        this.resetToRandomEdge(transform);
        return;
      }
    }

    // 2. LINEAR WRAPPING: Teleport to opposite side
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

  resetToRandomEdge(transform: InstanceTransform) {
    const { layout } = this.config;

    if (layout.type === LayoutType.SPHERE) {
      // SPHERE: Reset to a random point on the sphere surface
      const phi = random(0, Math.PI * 2);
      const theta = Math.acos(random(-1, 1));
      const r = layout.radius || 10;

      transform.position.set(
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(theta)
      );
    } 
    else {
      // GRID or FLOCK: Reset to a random face of the bounding box
      // Pick a random axis (0=X, 1=Y, 2=Z) and a random side (-1 or 1)
      const axis = randomInt(0, 2);
      const side = chance(0.5) ? 1 : -1;

      const x = random(-0.5, 0.5) * this.bounds.x;
      const y = random(-0.5, 0.5) * this.bounds.y;
      const z = random(-0.5, 0.5) * this.bounds.z;

      transform.position.set(x, y, z);

      // Force the chosen axis to the edge
      if (axis === 0) transform.position.x = (this.bounds.x / 2) * side;
      if (axis === 1) transform.position.y = (this.bounds.y / 2) * side;
      if (axis === 2) transform.position.z = (this.bounds.z / 2) * side;
    }
  }

  // PHASE 1: PHYSICS (Runs before script)
  updatePhysics(delta: number = 0.016) {
    const { groupMotion, motion } = this.config;

    // ANIMATE GROUP
    if (groupMotion) {
      if (groupMotion.rotation) {
        this.container.rotation.x += groupMotion.rotation.x * delta;
        this.container.rotation.y += groupMotion.rotation.y * delta;
        this.container.rotation.z += groupMotion.rotation.z * delta;
      }
      
      if (groupMotion.position) {
        // You could lerp here for smooth "target" movement
        this.container.position.lerp(groupMotion.position, 0.1);
      }
    }

    // 2. ANIMATE INSTANCES
    this.data.forEach((t, i) => {
      // Apply persistent motion
      if (t.motionSpeed) {
        t.position.add(t.motionSpeed.position);
        t.rotation.x += t.motionSpeed.rotation.x;
        t.rotation.y += t.motionSpeed.rotation.y;
        t.scale.x += t.motionSpeed.scale.x;
        t.scale.y += t.motionSpeed.scale.y;
      }

      // Apply radial motion
      if (t.motionSpeed?.radial && t.motionSpeed?.radial !== 0) {
        // Get vector from Origin to Current Position
        radialDir.copy(t.position);

        // Normalize to get direction (handle 0-distance edge case)
        if (radialDir.lengthSq() > 0.00001) {
          radialDir.normalize();
          t.position.addScaledVector(radialDir, t.motionSpeed.radial);
        }
        else {
          t.position.set(0, 0, 0);
        }
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

  setVisibility (visible: boolean) {
    if (!this.mesh.geometry.attributes.instanceVisible) return;

    for (let index = 0; index < this.data.length; index++) {
      this.mesh.geometry.attributes.instanceVisible.setX(index, visible ? 1 : 0);
      this.mesh.geometry.attributes.instanceVisible.needsUpdate = true;
    }    
  }

  setInstanceVisibility (index: number, visible: boolean) {
    if (!this.mesh.geometry.attributes.instanceVisible) return;

    this.mesh.geometry.attributes.instanceVisible.setX(index, visible ? 1 : 0);
    this.mesh.geometry.attributes.instanceVisible.needsUpdate = true;
  }

  removeInstancesScreenPosition = (instancesId: number[]) => {
    instancesId?.forEach(index => {
      useSceneBridge().removeScreenPosition(index);
    })
  }

  addInstancesScreenPosition = (instancesId: number[]) => {
    // Ensure the container matrix is up to date
    this.container.updateMatrixWorld();

    instancesId?.forEach((index, i) => {
      // 1. Get world position from instance matrix
      this.mesh.getMatrixAt(index, dummy.matrix);

      // Multiply by the container's world matrix to get actual 3D space coordinates
      worldPos.setFromMatrixPosition(dummy.matrix)
            .applyMatrix4(this.container.matrixWorld);

      // Calculate dimensions based on 3D scale
      const w = this.config.style.size.x * (this.data[index]?.scale.x ?? 1);
      const h = this.config.style.size.y * (this.data[index]?.scale.y ?? 1);

      // Use worldPos.clone() to avoid mutating the original vector
      dummyPos.copy(worldPos.clone()).add(new THREE.Vector3(w/2, h/2, 0));

      // 2. Calculate raw distance (in 3D units)
      const distance = worldPos.distanceTo(this.camera.position);
      
      // 3. Project to NDC for screen coordinates (-1 to 1)
      const screenVec = worldPos.clone().project(this.camera);
      const screenCornerVec = dummyPos.clone().project(this.camera);
      
      // 4. Check if point is in front of camera (z < 1)
      const visible = screenVec.z < 1;
    
      // 5. Calculate top-left point

      useSceneBridge().setScreenPosition(index, {
        x: screenVec.x * 0.5 + 0.5,
        y: -(screenVec.y * 0.5) + 0.5,
        visible,
        distance,
        left: screenCornerVec.x * 0.5 + 0.5,
        top: -(screenCornerVec.y * 0.5) + 0.5,
      });
    });
  }
  
  getDepthRowIndices (targetX: number, targetY: number) {
    const { dimensions } = this.config.layout;
    const indices: number[] = [];

    if (!dimensions) return indices;

    const { x: Dx, y: Dy, z: Dz } = dimensions;

    for (let z = 0; z < Dz; z++) {
      // Reconstruct the index based on the Z-major layout logic
      const index = (z * Dy * Dx) + (targetY * Dx) + targetX;
      indices.push(index);
    }
    
    return indices;
  }

  dispose(scene: THREE.Scene) {
    scene.remove(this.container);
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