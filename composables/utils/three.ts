import * as THREE from 'three';

/* ------------------------------
   Three.js Utilities
   ------------------------------ */

/**
 * Adds a per-instance visibility attribute to an InstancedMesh.
 * Allows dynamically hiding/showing instances via shader.
 * @param material MeshStandardMaterial to override shader
 * @param mesh InstancedMesh to apply visibility
 * @param count Number of instances
 */
export const addShaderVisibilityAttribute = (
  material: THREE.MeshBasicMaterial,
  mesh: THREE.InstancedMesh,
  count: number
) => {

  // Override material shader
  material.onBeforeCompile = (shader) => {
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

  // Create a Float32 visibility array and set the attribute
  const visibilityArray = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    visibilityArray[i] = 1;
  }

  mesh.geometry.setAttribute(
    'instanceVisible',
    new THREE.InstancedBufferAttribute(visibilityArray, 1)
  );
}

/**
 * Returns the element index based on 3d dimensions
 * @param x Index on the x axis
 * @param y Index on the y axis
 * @param z Index on the z axis
 * @param dims Size of the matrix (x, y, z)
 */
export const getIndex = (x: number, y: number, z: number, dims: {x: number, y: number, z: number}) => {
    return x + (y * dims.x) + (z * dims.x * dims.y);
  }