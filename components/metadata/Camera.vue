<script setup lang="ts">
const scene = use3DScene();

</script>

<template>
  <Box>Camera</Box>
  <div class="flex gap-0">
    <Box :width="5" :centered="true">x</Box>
    <Box :width="15" >{{ scene?.camera?.position.x.toFixed(1) }}</Box>
    <Box :width="5" :centered="true">y</Box>
    <Box :width="15" >{{ scene?.camera?.position.y.toFixed(1) }}</Box>
    <Box :width="5" :centered="true">z</Box>
    <Box :width="15" >{{ scene?.camera?.position.z.toFixed(1) }}</Box>
  </div>
</template>