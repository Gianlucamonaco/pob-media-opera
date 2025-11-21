<script setup lang="ts">
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ElementType, Shapes } from "~/composables/shapes";
import { set3DScene } from "~/composables/general";

const canvas = ref<HTMLCanvasElement | null>(null);
const {$wsAudio} = useNuxtApp();

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
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

  shapes = new Shapes();

  // shapes.create(ElementType.CIRCLES);

  window.addEventListener('keyup', (e) => {
    if (e.key == '0') {
      cameraEvents.RESET();
      shapes.removeAll();
    }
    if (e.key == '1') {
      cameraEvents.RESET();
      shapes.remove(0);
      shapes.create(ElementType.CIRCLES);
    }
    if (e.key == '2') {
      cameraEvents.RESET();
      shapes.remove(0);
      shapes.create(ElementType.RECTANGLES);
    }
    if (e.key == '3') {
      shapes.elements[0].material.uniforms.uThickness.value = Math.random() * 0.04;
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

const animate = () => {
  let s = requestAnimationFrame(animate);

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
</style>