import * as THREE from "three";
import type { ElementConfig, InstanceTransform } from "~/data/types";
import { LayoutType } from "~/data/constants";

export class LayoutGenerator {
  static generate(config: ElementConfig["layout"]): InstanceTransform[] {
    switch (config.type) {
      case LayoutType.GRID:   return this.generateGrid(config);
      case LayoutType.SPIRAL: return this.generateSpiral(config);
      case LayoutType.SPHERE: return this.generateSphere(config);
      case LayoutType.FLOCK:  return this.generateFlock(config);
      default: return [];
    }
  }

  private static generateGrid(layout: any): InstanceTransform[] {
    const transforms: InstanceTransform[] = [];
    const { x: dx, y: dy, z: dz } = layout.dimensions;
    const { x: sx, y: sy, z: sz } = layout.spacing;
    const origin = layout.origin || { x: 0, y: 0, z: 0 };

    let id = 0;
    for (let z = 0; z < dz; z++) {
      for (let y = 0; y < dy; y++) {
        for (let x = 0; x < dx; x++) {
          transforms.push({
            id: id++,
            // Centering logic: (index - (total - 1) / 2) * spacing
            position: new THREE.Vector3(
              (x - (dx - 1) / 2) * sx + origin.x,
              (y - (dy - 1) / 2) * sy + origin.y,
              (z - (dz - 1) / 2) * sz + origin.z
            ),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1),
            renderPosition: new THREE.Vector3(0, 0, 0),
            renderRotation: new THREE.Euler(0, 0, 0),
            renderScale: new THREE.Vector3(1, 1, 1),
          });
        }
      }
    }
    return transforms;
  }

  private static generateSphere(layout: any): InstanceTransform[] {
    const transforms: InstanceTransform[] = [];
    const count = layout.count || 100;
    const radius = layout.radius || 100;
    const origin = layout.origin || { x: 0, y: 0, z: 0 };
    
    // Fibonacci Sphere Algorithm for uniform distribution
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle in radians

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i; // golden angle increment

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      transforms.push({
        id: i,
        position: new THREE.Vector3(
          origin.x + x * radius,
          origin.y + y * radius,
          origin.z + z * radius
        ),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        renderPosition: new THREE.Vector3(0, 0, 0),
        renderRotation: new THREE.Euler(0, 0, 0),
        renderScale: new THREE.Vector3(1, 1, 1),
      });
    }
    return transforms;
  }

  private static generateSpiral(layout: any): InstanceTransform[] {
    const transforms: InstanceTransform[] = [];
    const count = layout.count || 50;
    const radius = layout.params?.radius || 100;
    const pitch = layout.params?.pitch || 0.5; // distance between points
    const verticalStep = layout.params?.verticalStep || 10;

    for (let i = 0; i < count; i++) {
      const angle = i * pitch;
      transforms.push({
        id: i,
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          i * verticalStep - (count * verticalStep) / 2
        ),
        rotation: new THREE.Euler(0, 0, -angle),
        scale: new THREE.Vector3(1, 1, 1),
        renderPosition: new THREE.Vector3(0, 0, 0),
        renderRotation: new THREE.Euler(0, 0, 0),
        renderScale: new THREE.Vector3(1, 1, 1),
      });
    }
    return transforms;
  }

  private static generateFlock(layout: any): InstanceTransform[] {
    const transforms: InstanceTransform[] = [];
    const count = layout.count || 50;
    const vol = layout.dimensions || { x: 500, y: 500, z: 500 };

    for (let i = 0; i < count; i++) {
      transforms.push({
        id: i,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * vol.x,
          (Math.random() - 0.5) * vol.y,
          (Math.random() - 0.5) * vol.z
        ),
        rotation: new THREE.Euler(0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        renderPosition: new THREE.Vector3(0, 0, 0),
        renderRotation: new THREE.Euler(0, 0, 0),
        renderScale: new THREE.Vector3(1, 1, 1),
        params: {},
      });
    }
    return transforms;
  }

  static getIndex(x: number, y: number, z: number, dims: {x: number, y: number, z: number}) {
    return x + (y * dims.x) + (z * dims.x * dims.y);
  }
}