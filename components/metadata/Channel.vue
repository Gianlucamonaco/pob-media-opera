<script setup lang="ts">
import { ChannelParams } from '~/data/constants';
const props = defineProps<{ channel: any, index: number, isActive: boolean }>()

</script>

<template>
  <Box :disabled="!isActive">{{ index }}</Box>

  <Box v-for="param in ChannelParams" :width="15" :disabled="!isActive">
    <span>{{ [ChannelParams.MIDI, ChannelParams.ONSET].includes(param) ? channel[param] : channel[param]?.toFixed(2) }}</span>

    <div
      v-if="param == ChannelParams.LOUDNESS"
      class="absolute top-0 left-0 h-full max-w-full z-[-1]"
      :class="[channel[param] < 1 ? 'bg-green-500' : 'bg-red-500']"
      :style="{ width: `${100 * channel[param]}%` }">
    </div>
  </Box>

</template>