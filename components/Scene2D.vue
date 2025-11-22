<script setup lang="ts">
import { Scene2D } from "~/composables/scene/2d";

const canvas = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
  if (!canvas.value) return;

  new Scene2D(canvas.value);
});

</script>

<template>
  <canvas id="canvas-2D" ref="canvas"></canvas>
</template>
