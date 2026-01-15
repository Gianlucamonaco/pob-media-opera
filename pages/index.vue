<script setup lang="ts">
import { KeyboardControls } from '~/composables/controls/keyboard';
import { MIDIControls } from '~/composables/controls/MIDI';
import { useSceneManager } from '~/composables/scene/manager';
import { ChannelNames } from '~/data/constants';

const { $wsAudio } = useNuxtApp() as any;
const { initScene3D, resetScene } = useSceneManager()

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
          resetScene()
        }
        else {
          initScene3D(parseInt(scene) - 1);
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