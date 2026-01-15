<script setup lang="ts">
const scene = use3DScene();

// wrap camera position in computed refs so Vue tracks changes
const cameraX = computed(() => scene.value?.camera?.position.x.toFixed(1));
const cameraY = computed(() => scene.value?.camera?.position.y.toFixed(1));
const cameraZ = computed(() => scene.value?.camera?.position.z.toFixed(1));
</script>

<template>
  <UiBox>Camera</UiBox>
  <div class="flex gap-0">
    <UiBox :width="5" :centered="true">x</UiBox>
    <UiBox :width="15" >{{ cameraX }}</UiBox>
    <UiBox :width="5" :centered="true">y</UiBox>
    <UiBox :width="15" >{{ cameraY }}</UiBox>
    <UiBox :width="5" :centered="true">z</UiBox>
    <UiBox :width="15" >{{ cameraZ }}</UiBox>
  </div>
</template>