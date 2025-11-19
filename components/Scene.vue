<script setup lang="ts">
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ElementType, Shapes } from "~/composables/shapes";
import { setScene } from "~/composables/general";

const canvas = ref<HTMLCanvasElement | null>(null);
const { $wsAudio } = useNuxtApp() as any;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
let controls: OrbitControls;
let renderer: THREE.WebGLRenderer;
let shapes: Shapes;
let raf: number;


onMounted(() => {
  if (!canvas.value) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color("#ddd");

  setScene(scene);

  camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 15000 );
  camera.position.set(0, 0, 100);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true });
  renderer.setSize(width, height);

  controls = new OrbitControls( camera, renderer.domElement );
  controls.update();

  controls.maxDistance = 1000;

  shapes = new Shapes();

  shapes.create(ElementType.CIRCLES);


  window.addEventListener('keyup', (e) => {
    if (e.key == '1') {
      shapes.remove(0);
      shapes.create(ElementType.CIRCLES);
    }
    if (e.key == '2') {
      shapes.remove(0);
      shapes.create(ElementType.RECTANGLES);
    }
    if (e.key == '3') {
      shapes.elements[0].material.uniforms.uThickness.value = Math.random() * 0.04;
    }
  })

  animate();
});


function animate() {
  requestAnimationFrame(animate);

  controls.update();
  shapes.update();

  renderer.render(scene, camera);
}

</script>

<template>
  <canvas ref="canvas"></canvas>
</template>

<style>
canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: block;
}
</style>