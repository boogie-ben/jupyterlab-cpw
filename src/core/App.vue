<template>
  <div style="height: 100%; width: 100%; overflow: auto;">
    <div
      v-for="cell in cells"
      :key="cell.id"
      style="margin: 20px;"
    >
      <div style="background-color: #222;">{{ cell.source }}</div>
      <hr />
      <div :id="cell.id" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{ content: string }>()

const cells = computed(() => JSON.parse(props.content).cells)
</script>

<style lang="scss" scoped>

</style>
