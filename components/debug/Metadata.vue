<script setup lang="ts">
const debug = useDebug();
const difference = false;

</script>

<template>
  <div v-if="debug">
    
    <div class="fixed top-0 left-0 z-10 text-sm" :class="{ 'mix-blend-difference': difference }">
      <DebugChannels />
    </div>

    <div class="fixed top-0 right-0 z-10 text-sm" :class="{ 'mix-blend-difference': difference }">
      <DebugCamera />
      <DebugMaster />
    </div>

    <div class="fixed bottom-0 left-0 z-10 text-sm" :class="{ 'mix-blend-difference': difference }">
      <DebugScenes />
    </div>

    <div class="fixed bottom-0 right-0 z-10 text-sm" :class="{ 'mix-blend-difference': difference }">
      <DebugControls />
    </div>

  </div>

</template>