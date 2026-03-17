<script setup lang="ts">
import { ChannelNames, InstrumentParams, MidiParams } from '~/data/constants';

const { $wsAudio } = useNuxtApp() as any;
const audioChannels = ref([] as any[]);
const midiChannels = ref([] as any[]);

Object.entries($wsAudio).forEach(item => {
  const index = parseInt(item[0]);

  if (index == ChannelNames.DRUMS_MIDI || index == ChannelNames.KEYS_MIDI) {
    midiChannels.value.push(item);
  }
  else if (index != ChannelNames.MASTER_CTRL) {
    audioChannels.value.push(item);
  }
})

</script>

<template>
  <client-only>
    <div class="flex flex-col gap-0">
      <div v-if="audioChannels" class="flex flex-col gap-0">
        <UiBox>Audio Channels</UiBox>

        <div class="flex gap-0">
          <div>
            <UiBox :width="30">#</UiBox>
            <UiBox v-for="param in InstrumentParams" :key="param" :width="30">{{ param }}</UiBox>
          </div>

          <div v-for="([index, channel]) in audioChannels" :key="index">
            <DebugChannelAudio
              :channel="channel"
              :index="index"
              :is-active="true" />
          </div>
        </div>
      </div>
      <div v-if="midiChannels" class="flex flex-col gap-0">
        <UiBox>Midi Channels</UiBox>

        <div class="flex gap-0">
          <div>
            <UiBox :width="30">#</UiBox>
            <UiBox :width="30">draw_0</UiBox>
            <UiBox :width="30">draw_1</UiBox>
            <UiBox :width="30">draw_2</UiBox>
            <UiBox :width="30">draw_3</UiBox>
            <UiBox :width="30">draw_4</UiBox>
            <UiBox :width="30">draw_5</UiBox>
            <UiBox :width="30">draw_6</UiBox>
            <UiBox :width="30">draw_7</UiBox>
            <UiBox :width="30">draw_8</UiBox>
            
            <UiBox :width="30">expr_0</UiBox>
            <UiBox :width="30">expr_1</UiBox>
            <UiBox :width="30">expr_2</UiBox>
          </div>

          <div v-for="([index, channel]) in midiChannels" :key="index">
            <DebugChannelMidi
              :channel="channel"
              :index="index"
              :is-active="true" />
          </div>
        </div>
      </div>
    </div>
  </client-only>
</template>