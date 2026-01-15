<script setup lang="ts">
const scene = use3DScene();

</script>

<template>
  <UiBox>Camera</UiBox>
  <div class="flex gap-0">
    <UiBox :width="5" :centered="true">x</UiBox>
    <UiBox :width="15" >{{ scene?.camera?.position.x.toFixed(1) }}</UiBox>
    <UiBox :width="5" :centered="true">y</UiBox>
    <UiBox :width="15" >{{ scene?.camera?.position.y.toFixed(1) }}</UiBox>
    <UiBox :width="5" :centered="true">z</UiBox>
    <UiBox :width="15" >{{ scene?.camera?.position.z.toFixed(1) }}</UiBox>
  </div>
</template>