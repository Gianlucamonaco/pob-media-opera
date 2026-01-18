<script setup lang="ts">
import { Scene2D } from "~/composables/scene/2d";

const canvas = ref<HTMLCanvasElement | null>(null);
let scene: Scene2D | null = null;

onMounted(() => {
  if (!canvas.value) return;
  if (!scene) scene = new Scene2D(canvas.value);
});

onBeforeUnmount(() => {
  scene?.destroy();
});

</script>

<template>
  <canvas id="canvas-2D" ref="canvas"></canvas>
</template>
