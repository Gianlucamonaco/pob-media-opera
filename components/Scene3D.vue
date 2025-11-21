<script setup lang="ts">
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ElementType, Shapes } from "~/composables/shapes";
import { set3DScene } from "~/composables/general";
import { initialParams } from "~/data/sceneParams";

const canvas = ref<HTMLCanvasElement | null>(null);
const sceneTitle = useSceneTitle();
const {$wsAudio} = useNuxtApp();

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let controls: OrbitControls;
let renderer: THREE.WebGLRenderer;
let shapes: Shapes;
let raf: number;
let lastInterval: number | undefined;

onMounted(() => {
  if (!canvas.value) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color("#ddd");

  set3DScene(scene);

  camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 15000 );
  camera.position.set(0, 0, 100);
  camera.lookAt(0, 0, 0);

  set3DCamera(camera);

  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true });
  renderer.setSize(width, height);

  controls = new OrbitControls( camera, renderer.domElement );
  controls.update();
  controls.maxDistance = 1000;

  set3DOrbitControls(controls);

  shapes = new Shapes();

  // shapes.create(ElementType.CIRCLES);

  window.addEventListener('keyup', (e) => {
    clearInterval(lastInterval)

    if (e.key == '0') {
      cameraEvents.RESET();
      shapes.removeAll();
      setSceneTitle('-');
    }
    if (e.key == '1') {
      shapes.removeAll();
      initScene(0);

      shapes.elements[0].setVisibility(true);
    }
    if (e.key == '2') {
      shapes.removeAll();
      initScene(1);
    }
    if (e.key == '3') {
      shapes.removeAll();
      initScene(2);
      // shapes.elements[0].material.uniforms.uThickness.value = Math.random() * 0.04;
    }
    if (e.key == '4') {
      shapes.removeAll();
      initScene(3);

      lastInterval = setInterval(() => {
        shapes.elements[0].setVisibility(false);

        for (let i = 0; i < 10; i++) {
          const row = Math.round(shapes.elements[0].rows * Math.random());
          const col = Math.round(shapes.elements[0].columns * Math.random());
          shapes.elements[0].setInstanceVisibility(row, col, true);
        }
      }, 500)
    }
    if (e.key == '5') {
      shapes.removeAll();
      initScene(4);
      
      lastInterval = setInterval(() => {
        shapes.elements[0].setVisibility(false);

        for (let i = 0; i < 2; i++) {
          if (i == 1 && Math.random() > 0.33) return;
          const row = Math.round(shapes.elements[0].rows * Math.random());
          const col = Math.round(shapes.elements[0].columns * Math.random());
          shapes.elements[0].setInstanceVisibility(row, col, true);          
        }
      }, 250)
    }
    if (e.key == 'r') {
      cameraEvents.ROTATE_90();
    }
  })

  window.addEventListener('resize', () => {
    resize();
  })


  animate();
});

const initScene = (index: number) => {
  const params = initialParams[index]!;

  setSceneTitle(params.title);
  console.log('initScene:', params.title );

  // Set camera
  cameraEvents.SET(params.camera.x, params.camera.y, params.camera.z);

  // Create shapes
  shapes.create(params.type, params.shapes);
}

const animate = () => {
  requestAnimationFrame(animate);

  controls.update();
  shapes.update();

  renderer.render(scene, camera);
}

const resize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize( width, height );
}

</script>

<template>
  <div class="info">
    <p class="info__act">Act: 1</p>
    <p class="info__title">Scene: {{ sceneTitle }}</p>
  </div>
  <canvas id="canvas-3D" ref="canvas"></canvas>
</template>

<style>
#canvas-3D {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: block;
}

p {
  padding: 0;
  margin: 0;
}

.info {
  position: fixed;
  z-index: 10;
  left: 1rem;
  top: 1rem;
  display: flex;
  gap: 2em;

  font-family: monospace;
  color: red;
}

.info p {
  width: 12rem;
}
</style>