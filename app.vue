<script setup lang="ts">
import { useControlsManager } from '~/composables/controls/manager';

const controls = useControlsManager();

onMounted(() => {
  controls.init();
});

onBeforeUnmount(() => {
  controls.destroy();
});

</script>

<template>
  <div>
    <NuxtPage />    
  </div>
</template>
