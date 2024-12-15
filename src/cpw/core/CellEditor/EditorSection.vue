<template>
  <div class="cpw-cell-editor-section">
    <div class="cpw-cell-editor-section-label">
      <span style="vertical-align: middle">{{ label }}</span>
      <t-tooltip
        v-if="desc"
        :content="desc"
      >
        <HelpCircleIcon style="vertical-align: middle; margin-left: 4px; font-size: 14px; color: var(--td-brand-color);" />
      </t-tooltip>
    </div>
    <div class="cpw-cell-editor-section-content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Tooltip as TTooltip } from 'tdesign-vue-next'
import { HelpCircleIcon } from 'tdesign-icons-vue-next'
defineProps<{ label: string, desc?: string }>()
</script>
