<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean,
  difference?: boolean,
  active?: boolean,
  width?: number,
  centered?: boolean,
  extraClass?: string
  onClick?: () => void,
}>()

</script>

<template>
  <div
    class="relative z-1 border-1 px-1 whitespace-nowrap"
    :class="[
      disabled && 'opacity-25',
      active && 'bg-[#eee] text-black',
      difference ? (!active ? 'bg-black text-[#eee]' : 'bg-[#eee] text-black') : (!active ? 'bg-black text-[#eee]' : 'bg-[#eee] text-black'),
      onClick && 'cursor-pointer',
      width && `w-${width}`,
      centered && 'text-center',
      extraClass
    ]"
    @click="onClick"
  >
    <slot />
  </div>
</template>