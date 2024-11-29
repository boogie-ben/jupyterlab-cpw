<template>
  <div class="cpw-cell-node">
    <!-- eslint-disable vue/no-v-html -->
    <div
      class="cpw-node-icon"
      v-html="statusIcon[data.status] || ''"
    />
    <div
      class="cpw-node-name"
      :title="data.name"
    >
      {{ data.name }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { statusIcon } from './index'

const getNode: any = inject('getNode')

const node: Node = getNode()

const data = reactive({
  id: node.id,
  name: '',
  status: 'changed',
})

const formatData = (newData: any) => {
  console.log(newData)
  Object.assign(data, newData)
}

formatData(node.getData())

node.on('change:data', (a) => {
  console.log(a)
  formatData(a.current)
})

</script>
