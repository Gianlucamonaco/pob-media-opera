<script setup lang="ts">
const controlsList = [
  { key: '0', text: 'First scene' },
  { key: '1', text: 'Solo 1' },
  { key: '2', text: 'Solo 2' },
  { key: '3', text: 'Solo 3' },
  { key: '4', text: 'Solo 4' },
  { key: '9', text: 'Last scene' },
  { key: '-', text: 'Clear scene' },
  { key: '/', text: 'Clear audio' },
  { key: 'E', text: 'End scene' },
  { key: 'D', text: 'Toggle UI' },
  { key: 'R', text: 'Rotate 90' },
  { key: 'S', text: 'Export PNG' },
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