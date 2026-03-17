<script setup lang="ts">
import { ChannelNames, InstrumentParams, MidiParams } from '~/data/constants';
const props = defineProps<{ channel: any, index: number | string, isActive: boolean }>()
const index = typeof props.index == 'number' ? props.index : parseInt(props.index);
const channelName = ChannelNames[index];

</script>

<template>
  <UiBox :width="20" :disabled="!isActive">
    {{ channelName }}
  </UiBox>

  <UiBox
    v-for="(param, index) in props.channel[MidiParams.DRAWBARS]"
    :key="`drawbar-${index}`"
    :width="20"
    :disabled="!isActive"
  >
    <div>{{ param }}</div>
  </UiBox>

  <UiBox
    v-for="(param, index) in props.channel[MidiParams.EXPRESS]"
    :key="`express-${index}`"
    :width="20"
    :disabled="!isActive"
  >
    <div>{{ param }}</div>
  </UiBox>
</template>