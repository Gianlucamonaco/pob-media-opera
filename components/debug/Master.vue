<script setup lang="ts">
import { useAudioManager } from '~/composables/audio/manager';

const { master } = useAudioManager();
const state = useSceneState();

</script>

<template>
  <clientOnly>
    <div v-if="master">
      <UiBox>
        <span class="block">Master</span>
      </UiBox>

      <div v-for="(value, key) in master" class="flex">
        <UiBox :width="30">{{ key }}</UiBox>
        <UiBox :width="30">{{ value }}</UiBox>
      </div>

      <div v-for="(value, key) in state" class="flex">
        <UiBox :width="30">{{ key }}</UiBox>
        <UiBox :width="30" :class="[value ? 'bg-green-500' : 'bg-red-500']">{{ value }}</UiBox>
      </div>
    </div>
  </clientOnly>

</template>