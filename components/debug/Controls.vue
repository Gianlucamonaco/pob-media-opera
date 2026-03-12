<script setup lang="ts">
const controlsList = [
  { key: '1', text: 'Act 1' },
  { key: '2', text: 'Act 2' },
  { key: '3', text: 'Act 3' },
  { key: '4', text: 'Last scene' },
  { key: '0', text: 'Reset audio/positions' },
  { key: 'E', text: 'End scene' },
  { key: 'D', text: 'Toggle UI' },
  { key: 'R', text: 'Rotate 90' },
  { key: 'S', text: 'Export PNG' },
  { key: '-', text: 'Clear scene' },
]
</script>

<template>
  <UiBox extra-class="w-full">Controls</UiBox>
  <div class="flex-col gap-0">
    <div v-for="({key, text}) in controlsList" :key="key" class="flex gap-0.25">
      <UiBox extra-class="!p-[1px]" :centered="true"><span class="w-5 inline-block px-1 border-1 rounded-sm text-xs">{{ key }}</span></UiBox>
      <UiBox :width="45">{{ text }}</UiBox>
    </div>
  </div>
</template>