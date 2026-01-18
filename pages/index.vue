<script setup lang="ts">
import { useAudioManager } from '~/composables/audio/manager';
import { useSceneManager } from '~/composables/scene/manager';
import { Scenes } from '~/data/constants';

const { initScene, resetScene } = useSceneManager()
const { master, reset } = useAudioManager()

// Observe master for changes
if (master) {
  watch(() => master.scene, (scene) => {
    if (scene) {
      if (scene == Scenes.STOP) {
        resetScene();
        reset();
      }
      else {
        initScene(parseInt(scene) - 1);
        reset();
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