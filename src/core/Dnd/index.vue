<template>
  <div
    ref="dndDom"
    class="cpw-dnd"
  >
    <!-- eslint-disable vue/no-v-html -->
    <div style="padding: 4px; width: 100%; display: flex; align-items: center; column-gap: 4px;">
      <t-input
        v-model="keyword"
        size="small"
        style="flex: 1"
        placeholder="搜索组件"
      />

      <t-button
        size="small"
        theme="primary"
        variant="text"
        shape="square"
      >
        <template #icon><PlusIcon size="20px" /></template>
      </t-button>
    </div>
    <template
      v-for="cate in list"
      :key="cate.id"
    >
      <div
        class="cpw-dnd-category"
        :title="cate.name"
        @click="toogleExpand(cate.id)"
      >
        <div
          class="cpw-dnd-category-icon"
          :expanded="dndExpanded[cate.id]"
          v-html="btnIcons.chevronRight"
        />
        <div class="cpw-dnd-category-label">{{ cate.name }}</div>
      </div>
      <template v-if="dndExpanded[cate.id]">
        <div
          v-for="item in cate.children"
          :key="item.key"
          class="cpw-dnd-component"
          :title="item.name"
          @mousedown="e => startDrag(e, item)"
        >
          {{ item.name }}
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
/* eslint-disable vue/no-side-effects-in-computed-properties */
import type { Dnd } from '@antv/x6-plugin-dnd'
import type { Graph } from '@antv/x6'
import { ref, defineExpose, onBeforeUnmount, computed } from 'vue'
import { initDnd } from '../Graph'
import { type NodeComponent, nodeCategory } from './utils'
import { btnIcons, type NodeCategory } from '../utils'
import { Input as TInput, Button as TButton } from 'tdesign-vue-next'
import { refDebounced } from '@vueuse/core'
import { PlusIcon } from 'tdesign-icons-vue-next'

let dnd: Dnd

const dndDom = ref<HTMLDivElement>()
const dndExpanded = ref<Record<string, boolean>>({})
const toogleExpand = (id: string) => {
  if (dndExpanded.value[id]) delete dndExpanded.value[id]
  else dndExpanded.value[id] = true
}

const keyword = ref('')
const dbKeyword = refDebounced(keyword, 500)

const list = computed<NodeCategory[]>(() => {
  const k = dbKeyword.value.trim()
  dndExpanded.value = {}
  if (!k) {
    dndExpanded.value[nodeCategory[0].id] = true
    return nodeCategory
  }
  const res = nodeCategory
    .map(cate => ({ ...cate, children: cate.children.filter(item => item.name.includes(k)) }))
    .filter(cate => {
      const bool = !!cate.children.length
      if (bool) dndExpanded.value[cate.id] = true
      return bool
    })
  return res
})

let startDrag: (e: MouseEvent, item: NodeComponent) => any

// const startDrag = (e: MouseEvent, item: NodeComponent) => {
//   const { key, name, source } = item
//   const node = graph.createNode({
//     shape: 'cpw-cell-node',
//     data: { key, name, source } as CPW.Cell,
//   })
//   dnd.start(node, e)
// }

defineExpose({
  init: (graph: Graph) => {
    dnd = initDnd(graph, dndDom.value!)
    startDrag = (e: MouseEvent, item: NodeComponent) => {
      const { key, name, source } = item
      const node = graph.createNode({
        shape: 'cpw-cell-node',
        data: { key, name, source } as CPW.Cell,
      })
      dnd.start(node, e)
    }
  },
})

onBeforeUnmount(() => dnd?.dispose())
</script>
