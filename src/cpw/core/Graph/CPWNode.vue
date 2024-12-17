<template>
  <div :class="['cpw-cell-node', data.active && 'cpw-cell-node-active', isErr && 'cpw-cell-node-error']">
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
import { Node } from '@antv/x6'
import { statusIcon } from './index'
import { inject, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

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

node.on('change:data', ({ current }) => {
  isErr.value = false
  Object.assign(data, current)
})

const isErr = ref(false) // 独立状态标记组件在运行前的校验中是否失败
const setErr = (e: CustomEvent<boolean>) => {
  isErr.value = e.detail
}
onMounted(() => { window.addEventListener<any>(`cpw-cell-error-${node.id}`, setErr) })

onBeforeUnmount(() => window.removeEventListener<any>(`cpw-cell-error-${node.id}`, setErr))

</script>
