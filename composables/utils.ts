import * as THREE from "three";

export const scaleCanvas = (canvas: HTMLCanvasElement, context: any, width: number, height: number) => {
  const devicePixelRatio = window.devicePixelRatio || 1;

  const backingStoreRatio = (
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio || 1
  );

  const ratio = devicePixelRatio / backingStoreRatio;

  if (devicePixelRatio !== backingStoreRatio) {
    canvas.width = width * ratio;
    canvas.height = height * ratio;

    if (canvas.style) {
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    }
  }
  else {
    canvas.width = width;
    canvas.height = height;
    if (canvas.style) {
      canvas.style.width = '';
      canvas.style.height = '';
    }
  }

  context.scale(ratio, ratio);
}

export const addShaderVisibilityAttribute = (material: THREE.MeshStandardMaterial, mesh: THREE.InstancedMesh, count: number) => {

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
    visibilityArray[i] = 0;
  }

  mesh.geometry.setAttribute(
    'instanceVisible',
    new THREE.InstancedBufferAttribute(visibilityArray, 1)
  );
}

// Ref: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export const shuffle = (array: any[]) =>  {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

// Ref: https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript?page=1&tab=scoredesc#tab-top
export function toLowercaseFirstLetter(value: string) {
  return String(value).charAt(0).toLowerCase() + String(value).slice(1);
}

export function toUppercaseFirstLetter(value: string) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}