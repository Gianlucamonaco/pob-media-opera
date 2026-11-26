<script setup lang="ts">
import { useAudioManager } from '~/composables/audio/manager';
import { useSceneManager } from '~/composables/scene/manager';
import { sceneListReduced } from '~/data/sceneList';

const { initScene } = useSceneManager();
const { reset } = useAudioManager();
const meta = useSceneMeta();

</script>

<template>
  <UiBox>Scenes</UiBox>
  <div class="flex gap-0">

    <div v-for="(sceneItem, index) in sceneListReduced" class="flex">
      <UiBox extra-class="!p-[1px]" :centered="true">
        <span class="w-8 inline-block px-1 border-1 rounded-sm text-xs">P{{ sceneItem.trackIndex + 13 }}</span>
      </UiBox>
      <UiBox
        :key="sceneItem.title"
        :active="sceneItem.title == meta?.title"
        :width="30"
        @click="() => {
          initScene(sceneListReduced.indexOf(sceneItem))
          reset();
        }"
      >
        {{ sceneItem.title }}
      </UiBox>
    </div>

  </div>
</template>