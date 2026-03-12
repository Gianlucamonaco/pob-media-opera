<script setup lang="ts">
</script>

<template>
  <UiBox extra-class="w-full">Controls</UiBox>
  <div class="flex-col gap-0">
    <div class="flex gap-0.25.25">
      <UiBox extra-class="!p-[1px]" :centered="true"><span class="w-5 inline-block px-1 border-1 rounded-sm text-xs">1</span></UiBox>
      <UiBox :width="45">Act 1</UiBox>
    </div>
    <div class="flex gap-0.25">
      <UiBox extra-class="!p-[1px]" :centered="true"><span class="w-5 inline-block px-1 border-1 rounded-sm text-xs">2</span></UiBox>
      <UiBox :width="45">Act 2</UiBox>
    </div>
    <div class="flex gap-0.25">
      <UiBox extra-class="!p-[1px]" :centered="true"><span class="w-5 inline-block px-1 border-1 rounded-sm text-xs">3</span></UiBox>
      <UiBox :width="45">Act 3</UiBox>
    </div>
    <div class="flex gap-0.25">
      <UiBox extra-class="!p-[1px]" :centered="true"><span class="w-5 inline-block px-1 border-1 rounded-sm text-xs">4</span></UiBox>
      <UiBox :width="45">Last scene</UiBox>
    </div>
    <div class="flex gap-0.25">
      <UiBox extra-class="!p-[1px]" :centered="true"><span class="w-5 inline-block px-1 border-1 rounded-sm text-xs">0</span></UiBox>
      <UiBox :width="45">Reset audio and pos</UiBox>
    </div>
    <div class="flex gap-0.25">
      <UiBox extra-class="!p-[1px]" :centered="true"><span class="w-5 inline-block px-1 border-1 rounded-sm text-xs">D</span></UiBox>
      <UiBox :width="45">Toggle UI</UiBox>
    </div>
    <div class="flex gap-0.25">
      <UiBox extra-class="!p-[1px]" :centered="true"><span class="w-5 inline-block px-1 border-1 rounded-sm text-xs">R</span></UiBox>
      <UiBox :width="45">Rotate 90</UiBox>
    </div>
    <div class="flex gap-0.25">
      <UiBox extra-class="!p-[1px]" :centered="true"><span class="w-5 inline-block px-1 border-1 rounded-sm text-xs">S</span></UiBox>
      <UiBox :width="45">Export PNG</UiBox>
    </div>
    <div class="flex gap-0.25">
      <UiBox extra-class="!p-[1px]" :centered="true"><span class="w-5 inline-block px-1 border-1 rounded-sm text-xs">-</span></UiBox>
      <UiBox :width="45">Clear scene</UiBox>
    </div>
  </div>
</template>