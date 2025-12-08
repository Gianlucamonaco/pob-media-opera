<script setup lang="ts">
import { scene3DParams } from '~/data/scene3DParams';

const meta = useSceneMeta();
const scene = use3DScene();
const debug = useDebug();
const { $wsAudio } = useNuxtApp() as any;
const difference = true;

</script>

<template>
  <div v-if="debug">
    <div class="fixed top-0 left-0 flex flex-col gap-05 z-10 text-sm" :class="[difference && 'mix-blend-difference']">
      <p class="px-1 bg-[#eee] text-black border-1">Controls</p>
      <div class="flex gap-05 text-xs">
        <p class="p-[1px] bg-[#eee] text-black text-center border-1"><span class="w-5 inline-block px-1 border-1 rounded-sm">1</span></p>
        <p class="p-[1px] bg-[#eee] text-black text-center border-1"><span class="w-5 inline-block px-1 border-1 rounded-sm">2</span></p>
        <p class="p-[1px] bg-[#eee] text-black text-center border-1"><span class="w-5 inline-block px-1 border-1 rounded-sm">3</span></p>
        <p class="p-[1px] bg-[#eee] text-black text-center border-1"><span class="w-5 inline-block px-1 border-1 rounded-sm">4</span></p>
        <p class="p-[1px] bg-[#eee] text-black text-center border-1"><span class="w-5 inline-block px-1 border-1 rounded-sm">5</span></p>
        <p class="p-[1px] bg-[#eee] text-black text-center border-1"><span class="w-5 inline-block px-1 border-1 rounded-sm">0</span></p>
        <p class="p-[1px] bg-[#eee] text-black text-center border-1"><span class="w-5 inline-block px-1 border-1 rounded-sm">D</span></p>
        <p class="p-[1px] bg-[#eee] text-black text-center border-1"><span class="w-5 inline-block px-1 border-1 rounded-sm">R</span></p>
        <p class="p-[1px] bg-[#eee] text-black text-center border-1"><span class="w-5 inline-block px-1 border-1 rounded-sm">-</span></p>
      </div>
    </div>

    <div class="fixed top-0 right-0 flex z-10 text-sm" :class="[difference && 'mix-blend-difference']">
      <client-only>
        <div v-if="$wsAudio" class="flex flex-col gap-05">
          <p class="px-1 bg-[#eee] text-black border-1">Channels</p>
          <div class="flex gap-05">
            <div v-for="(channel, index) in $wsAudio" class="flex gap-05">
              <p class="w-5 px-1 bg-[#eee] text-black border-1">{{ index }}</p>
              <p class="w-15 px-1 bg-[#eee] text-black border-1 relative"
              >{{ channel[0]?.toFixed(2) }}
              <div
                class="absolute top-0 left-0 h-full bg-[#000a] max-w-full"
                :class="[channel[0] > 1 && 'bg-cyan-500']"
                :style="{ width: `${100 * channel[0]}%` }"></div>
            </p>
            </div>
          </div>
        </div>
      </client-only>

      <div class="flex flex-col gap-05">
        <p class="px-1 bg-[#eee] text-black border-1">Camera</p>
        <div class="flex gap-05">
          <p class="w-5 px-1 bg-[#eee] text-black text-center border-1">x</p>
          <p class="w-15 px-1 bg-[#eee] text-black border-1">{{ scene?.camera?.position.x.toFixed(1) }}</p>
          <p class="w-5 px-1 bg-[#eee] text-black text-center border-1">y</p>
          <p class="w-15 px-1 bg-[#eee] text-black border-1">{{ scene?.camera?.position.y.toFixed(1) }}</p>
          <p class="w-5 px-1 bg-[#eee] text-black text-center border-1">z</p>
          <p class="w-15 px-1 bg-[#eee] text-black border-1">{{ scene?.camera?.position.z.toFixed(1) }}</p>
        </div>
      </div>
    </div>

    
    <div class="fixed bottom-0 left-0 z-10 text-sm" :class="[difference && 'mix-blend-difference']">

      <div v-for="act in [1, 2, 3]" class="gap-05">
        <p class="px-1 bg-[#eee] text-black border-1">Act {{ act }}</p>
        <div class="flex gap-05">
          <p
            v-for="({ title }) in scene3DParams.filter(s => s.act == act)"
            class="w-30 px-1 border-1 whitespace-nowrap cursor-pointer"
            :class="[meta?.title == title ? 'bg-black text-[#eee] border-1 border-black' : 'bg-[#eee] text-black border-1']"
            @click="() => scene?.initScene?.(scene3DParams.findIndex(s => s.title == title))"
          >{{ title }}</p>
        </div>
      </div>

    </div>
  </div>
</template>