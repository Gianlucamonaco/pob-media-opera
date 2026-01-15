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
  material: THREE.MeshStandardMaterial,
  mesh: THREE.InstancedMesh,
  count: number
) => {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute float instanceVisible; varying float vVisible;` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `
        #include <begin_vertex>
        vVisible = instanceVisible;
      `
    );

    shader.fragmentShader = `varying float vVisible;` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <dithering_fragment>",
      `
        if (vVisible < 0.5) discard;
        #include <dithering_fragment>
      `
    );
  };

  // Create a Float32 visibility array and set the attribute
  const visibilityArray = new Float32Array(count).fill(0);

  mesh.geometry.setAttribute(
    "instanceVisible",
    new THREE.InstancedBufferAttribute(visibilityArray, 1)
  );
};
