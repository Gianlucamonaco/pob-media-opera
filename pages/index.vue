<script setup lang="ts">
import { KeyboardControls } from '~/composables/controls/keyboard';
import { MIDIControls } from '~/composables/controls/MIDI';
import { ChannelNames } from '~/data/constants';

const { $wsAudio } = useNuxtApp() as any;

onMounted(() => {
  new KeyboardControls();
  new MIDIControls();
});

// Observe master for changes
if ($wsAudio) {
  watch(
    () => $wsAudio[ChannelNames.MASTER_CTRL].scene,
    (scene) => {
      if (scene) {
        if (scene == 'STOP') {
          use2DScene().value?.stop();
          use3DScene().value?.stop();
        }
        else {
          use3DScene().value.initScene(parseInt(scene) - 1);
        }
      }
  })
}

</script>

<template>
  <Scene3D />
  <Scene2D />
  <Metadata />
</template>