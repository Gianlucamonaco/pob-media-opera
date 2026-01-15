<script setup lang="ts">
import { KeyboardControls } from '~/composables/controls/keyboard';
import { MIDIControls } from '~/composables/controls/MIDI';
import { ChannelNames } from '~/data/constants';

const { $wsAudio } = useNuxtApp() as any;

useDebug();

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
          useScene2D().value?.stop();
          useScene3D().value?.stop();
        }
        else {
          useScene3D().value?.initScene(parseInt(scene) - 1);
        }
      }
  })
}

</script>

<template>
  <CanvasScene3D />
  <CanvasScene2D />
  <DebugMetadata />
</template>