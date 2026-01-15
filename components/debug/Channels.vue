<script setup lang="ts">
import { InstrumentParams } from '~/data/constants';

const { $wsAudio } = useNuxtApp() as any;
</script>

<template>
  <client-only>
    <div v-if="$wsAudio" class="flex flex-col gap-0">
      <UiBox>Channels</UiBox>

      <div class="flex gap-0">

        <div>
          <UiBox :width="30">#</UiBox>
          <UiBox v-for="param in InstrumentParams" :key="param" :width="30">{{ param }}</UiBox>
        </div>

        <div v-for="(channel, index) in $wsAudio" :key="index">
          <DebugChannel
            :channel="channel"
            :index="index"
            :is-active="true" />
        </div>

      </div>
    </div>
  </client-only>
</template>