<script setup lang="ts">
import { Acts } from '~/data/constants';
import { sceneList } from '~/data/sceneList';

const scene = use3DScene();
const meta = useSceneMeta();

</script>

<template>
  <div v-for="act in Object.values(Acts).filter(key => !isNaN(Number(key)))" class="flex flex-col gap-0">
    <UiBox>Act {{ act }}</UiBox>
    <div class="flex gap-0">
      <UiBox
        v-for="sceneItem in sceneList.filter(s => s.act == act)"
        :key="sceneItem.title"
        :active="sceneItem.title == meta?.title"
        :width="30"
        @click="() => scene?.initScene?.(sceneList.indexOf(sceneItem))"
      >
        {{ sceneItem.title }}
      </UiBox>
    </div>
  </div>
</template>