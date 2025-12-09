<script setup lang="ts">
import { scene3DParams } from '~/data/scene3DParams';

const meta = useSceneMeta();
const scene = use3DScene();
const debug = useDebug();
const { $wsAudio } = useNuxtApp() as any;
const difference = false;

const boxClass = ['border-1 px-1', difference ? 'bg-[#eee] text-black' : 'bg-black text-[#eee]'];

</script>

<template>
  <div v-if="debug">
    <div class="fixed top-0 left-0 flex flex-col gap-0 z-10 text-sm" :class="[difference && 'mix-blend-difference']">
      <p :class="boxClass">Controls</p>
      <div class="flex gap-0 text-xs">
        <p class="!p-[1px] text-center" :class="boxClass"><span class="w-5 inline-block px-1 border-1 rounded-sm">1</span></p>
        <p class="!p-[1px] text-center" :class="boxClass"><span class="w-5 inline-block px-1 border-1 rounded-sm">2</span></p>
        <p class="!p-[1px] text-center" :class="boxClass"><span class="w-5 inline-block px-1 border-1 rounded-sm">3</span></p>
        <p class="!p-[1px] text-center" :class="boxClass"><span class="w-5 inline-block px-1 border-1 rounded-sm">4</span></p>
        <p class="!p-[1px] text-center" :class="boxClass"><span class="w-5 inline-block px-1 border-1 rounded-sm">5</span></p>
        <p class="!p-[1px] text-center" :class="boxClass"><span class="w-5 inline-block px-1 border-1 rounded-sm">6</span></p>
        <p class="!p-[1px] text-center" :class="boxClass"><span class="w-5 inline-block px-1 border-1 rounded-sm">7</span></p>
        <p class="!p-[1px] text-center" :class="boxClass"><span class="w-5 inline-block px-1 border-1 rounded-sm">8</span></p>
        <p class="!p-[1px] text-center" :class="boxClass"><span class="w-5 inline-block px-1 border-1 rounded-sm">9</span></p>
        <p class="!p-[1px] text-center" :class="boxClass"><span class="w-5 inline-block px-1 border-1 rounded-sm">0</span></p>
      </div>
      <div class="flex gap-0 text-xs">
        <p class="!p-[1px] text-center" :class="boxClass"><span class="w-5 inline-block px-1 border-1 rounded-sm">D</span></p>
        <p class="!p-[1px] text-center" :class="boxClass"><span class="w-5 inline-block px-1 border-1 rounded-sm">R</span></p>
        <p class="!p-[1px] text-center" :class="boxClass"><span class="w-5 inline-block px-1 border-1 rounded-sm">-</span></p>
      </div>
    </div>

    <div class="fixed top-0 right-0 flex gap-0 z-10 text-sm" :class="[difference && 'mix-blend-difference']">
      <client-only>
        <div v-if="$wsAudio" class="flex flex-col gap-0">
          <p :class="boxClass">Channels</p>
          <div class="flex gap-0">
            <div v-for="(channel, index) in $wsAudio" class="flex gap-0">
              <p class="w-5" :class="boxClass">{{ index }}</p>
              <p class="w-15 relative" :class="boxClass"
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

      <div class="flex flex-col gap-0">
        <p :class="boxClass">Camera</p>
        <div class="flex gap-0">
          <p class="w-5 text-center" :class="boxClass">x</p>
          <p class="w-15" :class="boxClass">{{ scene?.camera?.position.x.toFixed(1) }}</p>
          <p class="w-5 text-center" :class="boxClass">y</p>
          <p class="w-15" :class="boxClass">{{ scene?.camera?.position.y.toFixed(1) }}</p>
          <p class="w-5 text-center" :class="boxClass">z</p>
          <p class="w-15" :class="boxClass">{{ scene?.camera?.position.z.toFixed(1) }}</p>
        </div>
      </div>
    </div>

    
    <div class="fixed bottom-0 left-0 z-10 flex flex-col gap-0 text-sm" :class="[difference && 'mix-blend-difference']">

      <div v-for="act in [1, 2, 3]" class="flex flex-col gap-0">
        <p :class="boxClass">Act {{ act }}</p>
        <div class="flex gap-0">
          <p
            v-for="({ title }) in scene3DParams.filter(s => s.act == act)"
            class="w-30 whitespace-nowrap cursor-pointer"
            :class="boxClass"
            @click="() => scene?.initScene?.(scene3DParams.findIndex(s => s.title == title))"
          >{{ title }}</p>
        </div>
      </div>

    </div>
  </div>
</template>