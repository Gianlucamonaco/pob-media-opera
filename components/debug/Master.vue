<script setup lang="ts">
import { ChannelNames, MasterParams } from '~/data/constants';
const { $wsAudio } = useNuxtApp() as any;

const channel = $wsAudio?.[ChannelNames.MASTER_CTRL];

</script>

<template>
  <clientOnly>
    <div v-if="$wsAudio">
      <UiBox>
        <span class="block">Master</span>
      </UiBox>

      <div v-for="param in MasterParams" class="flex">
        <UiBox class="w-30">{{ param }}</UiBox>
        <UiBox class="w-30">{{ channel[param] }}</UiBox>
      </div>
    </div>
  </clientOnly>

</template>