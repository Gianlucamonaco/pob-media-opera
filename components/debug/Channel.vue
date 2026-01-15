<script setup lang="ts">
import { ChannelNames, InstrumentParams } from '~/data/constants';
const props = defineProps<{ channel: any, index: number, isActive: boolean }>()
const channelName = Object.keys(ChannelNames).find((key: any) => (ChannelNames[key] as unknown as number) === props.index)

</script>

<template>
  <UiBox v-if="index != ChannelNames.MASTER_CTRL" :width="15" :disabled="!isActive">
    <div class="w-15">{{ channelName }}</div>
  </UiBox>

  <UiBox v-if="index != ChannelNames.MASTER_CTRL" v-for="param in InstrumentParams" :width="15" :disabled="!isActive">
    <div>{{ channel[param] }}</div>

    <div
      v-if="param == InstrumentParams.LOUDNESS"
      class="absolute top-0 left-0 h-full max-w-full z-[-1]"
      :class="[channel[param] < 1 ? 'bg-green-500' : 'bg-red-500']"
      :style="{ width: `${100 * channel[param]}%` }">
    </div>
  </UiBox>

</template>