<template>
  <div class="cpw-toolbar">
    <!-- eslint-disable vue/no-v-html -->
    <t-button
      v-for="btn, i in btns"
      :key="i"
      :title="btn.title"
      :disabled="btn.disabled"
      size="small"
      variant="text"
      shape="square"
      @click="btn.onClick"
    >
      <template #icon>
        <span
          class="t-icon"
          style="font-size: 16px;"
          v-html="btnIcons[btn.icon] || ''"
        />
      </template>
    </t-button>

    <t-button
      style="margin-left: auto;"
      title="内核状态"
      size="small"
      variant="text"
      :content="kernelStatusLabel[kernelStatus]"
    >
      <template #icon>
        <span
          class="t-icon"
          style="font-size: 16px;"
          v-html="btnIcons.kernel"
        />
      </template>
    </t-button>
  </div>
</template>

<script lang="ts" setup>
import { type ToolbarBtn, kernelStatusLabel, btnIcons } from '../utils'
import type { Kernel } from '@jupyterlab/services'
import { Button as TButton } from 'tdesign-vue-next'
defineProps<{
  btns: ToolbarBtn[]
  kernelStatus: Kernel.Status
}>()
</script>
