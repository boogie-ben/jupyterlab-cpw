<template>
  <div
    ref="_dndDom"
    class="cpw-dnd"
  >
    <!-- eslint-disable vue/no-v-html -->
    <div class="cpw-dnd-header">
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

    <div class="cpw-dnd-content">
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
  </div>
</template>

<script lang="ts" setup>
/* eslint-disable vue/no-side-effects-in-computed-properties */
import type { Dnd } from '@antv/x6-plugin-dnd'
import type { Graph } from '@antv/x6'
import { ref, defineExpose, onBeforeUnmount, computed, useTemplateRef } from 'vue'
import { initDnd } from '../Graph'
import { type CellComponent, type CellCategory } from './utils'
import { btnIcons, formatCellParams, formatCellIncomes } from '../utils'
import { Input as TInput, Button as TButton } from 'tdesign-vue-next'
import { refDebounced } from '@vueuse/core'
import { PlusIcon } from 'tdesign-icons-vue-next'

const props = defineProps<{
  loading: boolean
  data: CellCategory[]
}>()

let dnd: Dnd

const dndDom = useTemplateRef('_dndDom')
const dndExpanded = ref<Record<string, boolean>>({})
const toogleExpand = (id: string) => {
  if (dndExpanded.value[id]) delete dndExpanded.value[id]
  else dndExpanded.value[id] = true
}

const keyword = ref('')
const dbKeyword = refDebounced(keyword, 500)

const list = computed<CellCategory[]>(() => {
  const k = dbKeyword.value.trim()
  dndExpanded.value = {}
  if (!props.data.length) return []
  if (!k) {
    dndExpanded.value[props.data[0].id] = true
    return props.data
  }
  const res = props.data
    .map(cate => ({ ...cate, children: cate.children.filter(item => item.name.includes(k)) }))
    .filter(cate => {
      const bool = !!cate.children.length
      if (bool) dndExpanded.value[cate.id] = true
      return bool
    })
  return res
})

let startDrag: (e: MouseEvent, item: CellComponent) => any

// const startDrag = (e: MouseEvent, item: CellComponent) => {
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
    startDrag = (e: MouseEvent, item: CellComponent) => {
      if (e.button !== 0) return
      e.preventDefault()
      const { key, name, source, incomesConfig, outgos, paramsConfig } = item

      const node = graph.createNode({
        shape: 'cpw-cell-node',
        data: {
          key,
          name,
          source,
          // 对象数组引用类型，注意要clone
          incomes: formatCellIncomes(incomesConfig),
          outgos: [...outgos],
          params: formatCellParams(paramsConfig),
        } as CPW.Cell,
      })
      dnd.start(node, e)
    }
  },
})

onBeforeUnmount(() => dnd?.dispose())
</script>
