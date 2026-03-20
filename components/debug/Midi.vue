<script setup lang="ts">
import { midiState } from '~/composables/controls/MIDI';

const debug = useDebug();
const route = useRoute();
const knobs = reactive(midiState)

</script>

<template>
  <div v-if="debug || route.name == 'monitor'" class="fixed bottom-0 left-0 w-full z-10 flex gap-2 bg-black">

    <div v-for="(value, key) in knobs" class="flex flex-col flex-1">
      <div class="relative text-xs text-neutral-400 pt-1">
        {{ key.replace('knob', 'K').replace('pad', 'P') }}
        <div  
          class="absolute border-t-3 border-neutral-400 top-0 left-0"
          :style="{ width: `${value * 100}%` }"
        ></div>
      </div>
    </div>

</div>
</template>