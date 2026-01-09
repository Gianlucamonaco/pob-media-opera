<script setup lang="ts">
import { ChannelNames, MasterParams } from '~/data/constants';
const { $wsAudio } = useNuxtApp() as any;

const channel = $wsAudio?.[ChannelNames.MASTER_CTRL];

</script>

<template>
  <div v-if="$wsAudio">
    <Box>
      <span class="block">Master</span>
    </Box>

    <div v-for="param in MasterParams" class="flex">
      <Box class="w-30">{{ param }}</Box>
      <Box class="w-30">{{ channel[param] }}</Box>
    </div>
  </div>

</template>