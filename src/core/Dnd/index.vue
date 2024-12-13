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
        @click="openNew"
      >
        <template #icon><PlusIcon size="20px" /></template>
      </t-button>
    </div>

    <t-loading
      class="cpw-dnd-content"
      :loading="categories_loading"
      :delay="200"
      size="small"
    >
      <template
        v-for="item in list"
        :key="item.id"
      >
        <div
          class="cpw-dnd-category"
          :title="item.name"
          @click="toogleExpand(item.id)"
        >
          <ChevronRightIcon
            class="cpw-dnd-category-icon"
            :expanded="dndExpanded[item.id]"
          />
          <div class="cpw-dnd-category-label">{{ item.name }}</div>
        </div>
        <template v-if="dndExpanded[item.id]">
          <div
            v-for="c in item.children"
            :key="c.key"
            class="cpw-dnd-component"
            :title="item.name"
            @mousedown="e => startDrag(e, c)"
          >
            {{ c.name }}
          </div>
        </template>
      </template>
    </t-loading>
    <CellEditor
      ref="_CellEditor"
      @done="emit('refreshCategory')"
    />
  </div>
</template>

<script lang="ts" setup>
/* eslint-disable vue/no-side-effects-in-computed-properties */
import type { Dnd } from '@antv/x6-plugin-dnd'
import type { Graph } from '@antv/x6'
import { ref, defineExpose, onBeforeUnmount, computed, useTemplateRef } from 'vue'
import { initDnd } from '../Graph'
import { formatCellParams, formatCellIncomes, formatCellOutgos } from '../cellHandlers'
import { Input as TInput, Button as TButton, Loading as TLoading } from 'tdesign-vue-next'
import { refDebounced } from '@vueuse/core'
import { PlusIcon, ChevronRightIcon } from 'tdesign-icons-vue-next'
import CellEditor from '../CellEditor/index.vue'

const categories = computed(() => window.__cpw_categories.value)
const categories_loading = computed(() => window.__cpw_categories_loading.value)

const emit = defineEmits(['refreshCategory'])

let dnd: Dnd

const dndDom = useTemplateRef('_dndDom')
const dndExpanded = ref<Record<string, boolean>>({})
const toogleExpand = (id: string) => {
  if (dndExpanded.value[id]) delete dndExpanded.value[id]
  else dndExpanded.value[id] = true
}

const keyword = ref('')
const dbKeyword = refDebounced(keyword, 500)

const list = computed<CPW.CellCategory[]>(() => {
  const k = dbKeyword.value.trim()
  dndExpanded.value = {}
  if (!categories.value.length) return []
  if (!k) {
    dndExpanded.value[categories.value[0].id] = true
    return categories.value
  }
  const res = categories.value
    .map(cate => ({ ...cate, children: cate.children.filter(item => item.name.includes(k)) }))
    .filter(cate => {
      const bool = !!cate.children.length
      if (bool) dndExpanded.value[cate.id] = true
      return bool
    })
  return res
})

let startDrag: (e: MouseEvent, item: CPW.CellComponent) => any

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
    startDrag = (e: MouseEvent, item: CPW.CellComponent) => {
      if (e.button !== 0) return
      e.preventDefault()
      const { key, name, source, incomesConfig, outgosConfig, paramsConfig } = item

      const node = graph.createNode({
        shape: 'cpw-cell-node',
        data: {
          key,
          name,
          source,
          // 对象数组引用类型，注意要clone
          incomes: formatCellIncomes(incomesConfig),
          outgos: formatCellOutgos(outgosConfig),
          params: formatCellParams(paramsConfig),
        } as CPW.Cell,
      })
      dnd.start(node, e)
    }
  },
})

onBeforeUnmount(() => dnd?.dispose())

const CellEditorRef = useTemplateRef('_CellEditor')
const openNew = () => {
  CellEditorRef.value?.openNew()
}
</script>
