<script setup lang="ts">

onMounted(() => {
  new KeyControls();
});

</script>

<template>
  <Scene3D />
  <Scene2D />
  <Metadata />
</template>