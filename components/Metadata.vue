<script setup lang="ts">
const debug = useDebug();
const difference = false;

</script>

<template>
  <div v-if="debug">
    
    <div class="fixed top-0 left-0 z-10 text-sm" :class="[difference && 'mix-blend-difference']">
      <MetadataChannels />
    </div>

    <div class="fixed top-0 right-0 z-10 text-sm" :class="[difference && 'mix-blend-difference']">
      <MetadataMaster />
      <MetadataCamera />
    </div>

    <div class="fixed bottom-0 left-0 z-10 text-sm" :class="[difference && 'mix-blend-difference']">
      <MetadataScenes />
    </div>

    <div class="fixed bottom-0 right-0 z-10 text-sm" :class="[difference && 'mix-blend-difference']">
      <MetadataControls />
    </div>

  </div>

</template>