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
      <div class="flex flex-col gap-05">
        <p class="px-1 bg-[#eee] text-black border-1">Channels</p>
        <div class="flex gap-05">
          <p
            v-for="(channel, index) in $wsAudio"
            class="w-20 px-1 bg-[#eee] text-black border-1"
            :class="[channel[0] > 1 && 'bg-cyan-500']"
          >{{ index }}: {{ channel[0].toFixed(2) }}</p>
        </div>
      </div>

      <div class="flex flex-col gap-05">
        <p class="px-1 bg-[#eee] text-black border-1">Camera</p>
        <div class="flex gap-05">
          <p class="w-20 px-1 bg-[#eee] text-black border-1">x: {{ scene?.camera?.position.x.toFixed(1) }}</p>
          <p class="w-20 px-1 bg-[#eee] text-black border-1">y: {{ scene?.camera?.position.y.toFixed(1) }}</p>
          <p class="w-20 px-1 bg-[#eee] text-black border-1">z: {{ scene?.camera?.position.z.toFixed(1) }}</p>
        </div>
      </div>
    </div>

    

    <div class="fixed bottom-0 left-0 flex flex-col gap-05 z-10 text-sm" :class="[difference && 'mix-blend-difference']">
      <p class="px-1 bg-[#eee] text-black border-1">Act 1</p>
      <div class="flex gap-05">
        <p
          v-for="({ title }, index) in scene3DParams.filter(({ act }) => act == 1)"
          class="w-24 px-1 border-1 cursor-pointer"
          :class="[meta?.title == title ? 'bg-black text-[#eee] border-1 border-black' : 'bg-[#eee] text-black border-1']"
          @click="() => scene?.initScene?.(index)"
        >{{ title }}</p>
      </div>
    </div>
  </div>
</template>