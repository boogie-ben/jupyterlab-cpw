<template>
  <div :class="['cpw-cell-node', data.active && 'cpw-cell-node-active']">
    <div
      class="cpw-node-name"
      :title="data.name"
    >
      {{ data.name }}
    </div>
    <!-- eslint-disable vue/no-v-html -->
    <div
      class="cpw-node-icon"
      v-html="statusIcon[data.status] || ''"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { statusIcon } from './index'
import { inject, reactive } from 'vue'

const getNode: any = inject('getNode')

const node: Node = getNode()

const defaultData: CPW.Cell = {
  id: node.id,
  key: -1,
  name: '',
  source: '',
  status: 'changed',
  active: false,
  outputs: [],
  node: undefined,
  desc: '',
  incomes: [],
  outgos: [],
  params: [],
}

const data = reactive<CPW.Cell>({
  ...defaultData,
  ...node.getData<CPW.Cell>(),
})

node.setData({ ...data })

node.on('change:data', ({ current }) => Object.assign(data, current))

</script>
