<script setup lang="ts">
import { Scene3D } from "~/composables/scene/3d";

const canvas = ref<HTMLCanvasElement | null>(null);
let scene: Scene3D | null = null;

onMounted(() => {
  if (!canvas.value) return;
  if (!scene) scene = new Scene3D(canvas.value);
});

onBeforeUnmount(() => {
  scene?.destroy();
});

</script>

<template>
  <canvas id="canvas-3D" ref="canvas"></canvas>
</template>