<script setup lang="ts">
import { Scene3D } from "~/composables/scene/3d";

const canvas = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
  if (!canvas.value) return;

  new Scene3D(canvas.value);
});

</script>

<template>
  <canvas id="canvas-3D" ref="canvas"></canvas>
</template>