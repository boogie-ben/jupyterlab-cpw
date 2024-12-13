<template>
  <div class="cpw-cell-editor-section">
    <div class="cpw-cell-editor-section-label">
      <span>{{ label }}</span>
      <t-tooltip
        v-if="desc"
        :content="desc"
      >
        <HelpCircleIcon style="line-height: 0; font-size: 14px; color: var(--td-brand-color); vertical-align: text-top; margin-left: 4px;" />
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
