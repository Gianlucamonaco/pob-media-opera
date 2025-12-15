<script setup lang="ts">
import { ChannelParams } from '~/data/constants';

const { $wsAudio } = useNuxtApp() as any;
</script>

<template>
  <client-only>
    <div v-if="$wsAudio" class="flex flex-col gap-0">
      <Box>Channels</Box>

      <div class="flex gap-0">

        <div>
          <Box :width="30">#</Box>
          <Box v-for="param in ChannelParams" :width="30">{{ param }}</Box>
        </div>

        <div v-for="(channel, index) in $wsAudio">
          <MetadataChannel :channel="channel" :index="parseInt(index.toString())" :is-active="index < 5" />
        </div>

      </div>
    </div>
  </client-only>
</template>