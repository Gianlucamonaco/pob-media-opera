<script setup lang="ts">
import { clamp, mapLinear } from "three/src/math/MathUtils.js";

const canvas = ref<HTMLCanvasElement | null>(null);

let ctx: CanvasRenderingContext2D | null;
let raf: number;

const text = [
'Is this the Region, this the Soil, the Clime',
'Said then the lost Arch-Angel, this the seat',
'That we must change for Heav’n, this mournful gloom',
'For that celestial light? Be it so, since he',
'Who now is Sovran can dispose and bid',
'What shall be right: fardest from him is best',
'Whom reason hath equald, force hath made supream',
'Above his equals. Farewel happy Fields',
'Where Joy for ever dwells: Hail horrours, hail',
'Infernal world, and thou profoundest Hell',
'Receive thy new Possessor: One who brings',
'A mind not to be chang’d by Place or Time.'
];

onMounted(() => {
  if (!canvas.value) return;

  resizeCanvas();

  animate();

  window.addEventListener('resize', (e) => {
    resizeCanvas()
  })

});

function resizeCanvas () {
  if (!canvas.value) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  ctx = canvas.value.getContext('2d');

  scaleCanvas(canvas.value, ctx, width, height);
}

let progress = 0;

function animate () {
  if (!ctx || !canvas.value) return;

  requestAnimationFrame(animate);

  ctx.clearRect(0, 0, canvas.value?.width, canvas.value?.height)

  drawText();
}

function drawText () {
  if (!ctx || !canvas.value) return;

  const { $wsAudio } = useNuxtApp() as any;
  const channelInput = $wsAudio[2];

  let baseFontSize = 60;
  let padding = { x: 20, y: 20 };
  let totalCount = text.reduce((acc, val) => { return acc += val.length }, 0);

  for (let l = 0; l < text.length; l++) {
    
    let letterPos = 0;

    const line = text[l]?.split('') ?? [];

    for (let c = 0; c < line.length; c ++) {
      // Multi line highlight based on cos of progress
      // const val = 0.5 + Math.cos(((progress / 10 - c - l * line.length) / Math.PI * 180) / 800) * 0.5;

      // Single line highlight based on progress value
      // const pos = (c + l * line.length);
      // const val = clamp(mapLinear(Math.abs(((progress*0.5) % totalCount) - pos), 0, 20, 1, 0), 0, 1);

      // Multi line highlight based on frequency (note: need to keep track of latest freq value)
      const val = clamp(mapLinear(Math.cos((((channelInput[1] * 200 + progress * 1.5) / 500 + (c + l * line.length) * 0.1) / Math.PI * 180) / 200), -1, 1, -20, 1), 0, channelInput[0] * 15);

      // Single line highlight based on frequency (note: freq progress is not linear, to adjust)
      // const pos = (c + l * line.length);
      // const freq = mapLinear(channelInput[1], 220, 880, 0, totalCount)
      // const val = clamp(mapLinear(Math.abs((freq % totalCount) - pos), 0, 100 + 100 * channelInput[0], 1, 0), 0, 1.5);

      ctx.font = `${baseFontSize + val * 24}px serif`;
      ctx.globalAlpha = val;

      const char = line[c] ?? '';
      ctx?.fillText(char, padding.x + letterPos, padding.y + baseFontSize + l * (baseFontSize + 24));

      letterPos += ctx.measureText(char).width;
    }
  }

  progress++;
}

</script>

<template>
  <canvas id="canvas-2D" ref="canvas"></canvas>
</template>

<style>
#canvas-2D {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: block;
  pointer-events: none;
}
</style>