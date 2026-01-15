<script setup lang="ts">
import { Acts } from '~/data/constants';
import { scene3DParams } from '~/data/scene3DParams';

const scene = use3DScene();
const meta = useSceneMeta();

</script>

<template>
  <div v-for="act in Object.values(Acts).filter(key => !isNaN(Number(key)))" class="flex flex-col gap-0">
    <UiBox>Act {{ act }}</UiBox>
    <div class="flex gap-0">
      <UiBox
        v-for="({ title }) in scene3DParams.filter(s => s.act == act)"
        :active="title == meta?.title"
        :width="30"
        :on-click="() => scene?.initScene?.(scene3DParams.findIndex(s => s.title == title))"
      >
        {{ title }}
      </UiBox>
    </div>
  </div>
</template>