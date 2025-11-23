<script setup lang="ts">
import { KeyboardControls } from '~/composables/controls/keyboard';
import { MIDIControls } from '~/composables/controls/MIDI';

onMounted(() => {
  new KeyboardControls();
  new MIDIControls();
});

</script>

<template>
  <Scene3D />
  <Scene2D />
  <Metadata />
</template>