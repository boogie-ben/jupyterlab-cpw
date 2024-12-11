<template>
  <div class="cpw-cell-editor-section">
    <div class="cpw-cell-editor-section-label">{{ label }}</div>
    <div class="cpw-cell-editor-section-content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{ label: string }>()
</script>
