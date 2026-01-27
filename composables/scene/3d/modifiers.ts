import * as THREE from 'three';
import type { InstanceTransform } from "~/data/types";

const _m1 = new THREE.Matrix4();
const _q1 = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();

export const Modifiers = {
  /**
   * Bends the grid into a tunnel shape based on Z position.
   * Great for "wormhole" effects.
   */
  gridBend: (t: InstanceTransform, params: { x?: number, y?: number, z?: number, freqX?: number, freqY?: number, freqZ?: number }) => {
    const z = t.relative?.z ?? 0;
    
    // Calculate curve offset
    if (params.x) {
      const offsetX = Math.sin(z * (params.freqX || 1)) * params.x;
      t.renderPosition.x += offsetX;
    }

    if (params.y) {
      const offsetY = Math.sin(z * (params.freqY || 1)) * params.y;
      t.renderPosition.y += offsetY;
    }

    if (params.z) {
      const offsetZ = Math.sin(z * (params.freqZ || 1)) * params.z;
      t.renderPosition.z += offsetZ;
    }
    
    // Optional: Rotate the object to follow the curve
    // t.renderRotation.z += offsetX * 0.01; 
  },

  /**
   * Creates a linear slope (Ramp).
   * @param slopeY - How much Y drops per unit of Z
   */
  gridSlope: (t: InstanceTransform, totalHeight: number) => {
    const z = t.relative?.z ?? 0;

    t.renderPosition.y += (z * 2) * totalHeight;
  },

  /**
   * Linearly scales the grid spacing along the Z axis.
   * Useful for "Pyramid" or "Funnel" shapes.
   * @param startScale - Scale at the START of the tunnel (relative Z = 0)
   * @param endScale - Scale at the END of the tunnel (relative Z = 1)
   */
  gridNarrow: (t: InstanceTransform, startScale: number = 1, endScale: number = 0.5, scale: boolean = false) => {
    const z = t.relative?.z ?? 0; // range -0.5 to 0.5
    const normalizedZ = z + 0.5;

    // Linear Interpolation (Lerp)
    const currentScale = endScale + (startScale - endScale) * normalizedZ;

    // Apply to position (spacing)
    t.renderPosition.x *= currentScale;
    t.renderPosition.y *= currentScale;
    
    // Also scale the object itself to match the perspective
    t.renderScale.multiplyScalar(currentScale);
  },

  /**
   * Creates a "Compress" effect in the center.
   * @param centerScale - The scale multiplier at the center (Relative Z = 0.5)
   */
  gridCompress: (t: InstanceTransform, centerScale: number = 2) => {
    const z = t.relative?.z ?? 0; // range -0.5 to 0.5
    
    // Convert Z to a 0 -> 1 -> 0 curve (Sine wave)
    const strength = Math.max(0, Math.cos(z * Math.PI));

    // Interpolate between 1 (normal) and centerScale
    const scaleFactor = 1 + (centerScale - 1) * strength;

    t.renderPosition.x *= scaleFactor;
  },

  /**
   * Forces an instance to face a target (usually the camera).
   * @param t - The transform to modify
   * @param target - THREE.Vector3 target position
   * @param offsetRotation - Optional Euler for correcting geometry orientation
   */
  lookAt: (t: InstanceTransform, target: THREE.Vector3, localRotation?: THREE.Euler) => {
    // Point at target
    _m1.lookAt(t.renderPosition, target, THREE.Object3D.DEFAULT_UP);
    _q1.setFromRotationMatrix(_m1);

    // If we have a local rotation (like your audio wobble), apply it RELATIVELY
    if (localRotation) {
      _q2.setFromEuler(localRotation);
      _q1.multiply(_q2); // Multiply Quaternions = Combine Rotations locally
    }

    // Update the final render rotation
    t.renderRotation.setFromQuaternion(_q1);
  },
};