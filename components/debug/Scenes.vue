<script setup lang="ts">
import { useAudioManager } from '~/composables/audio/manager';
import { useSceneManager } from '~/composables/scene/manager';
import { Acts } from '~/data/constants';
import { sceneList } from '~/data/sceneList';

const { initScene } = useSceneManager();
const { reset } = useAudioManager();
const meta = useSceneMeta();

</script>

<template>
  <div v-for="act in Object.values(Acts).filter(key => !isNaN(Number(key)))" class="flex flex-col gap-0">
    <UiBox>Act {{ act }}</UiBox>
    <div class="flex gap-0">

      <div v-for="(sceneItem, index) in sceneList.filter(s => s.act == act)" class="flex">
        <UiBox extra-class="!p-[1px]" :centered="true">
          <span class="w-8 inline-block px-1 border-1 rounded-sm text-xs">P{{ sceneItem.trackIndex + 17 }}</span>
        </UiBox>
        <UiBox
          :key="sceneItem.title"
          :active="sceneItem.title == meta?.title"
          :width="30"
          @click="() => {
            initScene(sceneList.indexOf(sceneItem))
            reset();
          }"
        >
          {{ sceneItem.title }}
        </UiBox>
      </div>

    </div>
  </div>
</template>