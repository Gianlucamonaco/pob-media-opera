<script setup lang="ts">
import { Scene3D } from "~/composables/scene/3d";
import { KeyControls } from "~/composables/keyControls";

const canvas = ref<HTMLCanvasElement | null>(null);
const sceneTitle = useSceneTitle();

onMounted(() => {
  if (!canvas.value) return;

  new Scene3D(canvas.value);
});

</script>

<template>
  <div class="info">
    <p class="info__act">Act: 1</p>
    <p class="info__title">Scene: {{ sceneTitle }}</p>
  </div>
  <canvas id="canvas-3D" ref="canvas"></canvas>
</template>