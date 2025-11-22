<script setup lang="ts">
const meta = useSceneMeta();

</script>

<template>
  <div class="metadata">
    <p>Act: {{ meta?.act }}</p>
    <p>Track: {{ meta?.trackIndex }}</p>
    <p>Scene: {{ meta?.title }}</p>
  </div>
</template>