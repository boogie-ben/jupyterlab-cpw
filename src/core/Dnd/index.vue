<template>
  <div
    ref="dndDom"
    class="cpw-dnd"
  >
    123
  </div>
</template>

<script lang="ts" setup>
defineProps<{ collapsed: boolean }>()
const dndDom = ref<HTMLDivElement>()

</script>
