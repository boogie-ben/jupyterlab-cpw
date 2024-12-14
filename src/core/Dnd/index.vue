<template>
  <div
    ref="_dndDom"
    class="cpw-dnd"
  >
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
        v-for="cate, cateIdx in list"
        :key="cate.id"
      >
        <div
          class="cpw-dnd-category"
          :title="cate.name"
          @click="toogleExpand(cate.id)"
        >
          <ChevronRightIcon
            class="cpw-dnd-category-icon"
            :expanded="dbKeyword ? true : dndExpanded[cate.id]"
          />
          <div class="cpw-dnd-category-label">{{ cate.name }}</div>
        </div>
        <template v-if="dbKeyword ? true : dndExpanded[cate.id]">
          <t-tooltip
            v-for="comp, compIdx in cate.children"
            :key="comp.key"
            placement="right-top"
            :overlay-inner-style="{ width: '300px', padding: '8px 12px' }"
          >
            <template #content>
              <div v-if="comp.desc">{{ comp.desc }}</div>
              <div
                v-else
                style="color: var(--td-text-color-secondary);"
              >
                组件无描述
              </div>
              <!-- v-if="comp.genre === 'custom'" -->
              <div
                style="display: flex; padding-top: 12px;"
              >
                <t-button
                  content="删除"
                  variant="text"
                  theme="danger"
                  size="small"
                  style="margin-left: auto"
                  @click="del(comp.key, compIdx, cateIdx)"
                />
              </div>
            </template>
            <div
              class="cpw-dnd-component"
              :title="comp.name"
              @mousedown="e => startDrag(e, comp)"
            >
              {{ comp.name }}
            </div>
          </t-tooltip>
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
import type { Dnd } from '@antv/x6-plugin-dnd'
import type { Graph } from '@antv/x6'
import { ref, defineExpose, onBeforeUnmount, computed, useTemplateRef } from 'vue'
import { initDnd } from '../Graph'
import { formatCellParams, formatCellIncomes, formatCellOutgos } from '../cellHandlers'
import { Input as TInput, Button as TButton, Loading as TLoading, Tooltip as TTooltip } from 'tdesign-vue-next'
import { watchDebounced } from '@vueuse/core'
import { PlusIcon, ChevronRightIcon } from 'tdesign-icons-vue-next'
import CellEditor from '../CellEditor/index.vue'
import { Dialog, showDialog } from '@jupyterlab/apputils'
import { reqDelComponent } from '../api'

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
// const dbKeyword = refDebounced(keyword, 500)
const dbKeyword = ref('')
watchDebounced(
  () => keyword.value,
  () => { dbKeyword.value = keyword.value.trim().toLowerCase() },
  { debounce: 500 },
)

const list = computed<CPW.CellCategory[]>(() => {
  if (!categories.value.length) return []
  if (!dbKeyword.value) return categories.value
  const res = categories.value
    .map(cate => ({
      ...cate,
      children: cate.children.filter(comp => comp.name.toLowerCase().includes(dbKeyword.value)),
    }))
    .filter(cate => cate.children.length)
  return res
})

// watch(() => dbKeyword.value, () => {
//   if (dbKeyword.value.trim())
// })

let startDrag: (e: MouseEvent, comp: CPW.CellComponent) => any

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
    startDrag = (e: MouseEvent, comp: CPW.CellComponent) => {
      if (e.button !== 0) return
      e.preventDefault()
      const { key, name, desc, source, incomesConfig, outgosConfig, paramsConfig } = comp

      const node = graph.createNode({
        shape: 'cpw-cell-node',
        data: {
          key,
          name,
          desc,
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

const del = async (compKey: number, compIdx: number, cateIdx: number) => {
  const { button } = await showDialog({
    title: '确认删除组件？',
    buttons: [
      Dialog.cancelButton({ label: '取消' }),
      Dialog.warnButton({ label: '删除' }),
    ],
    defaultButton: 0,
  })
  if (button.label !== '删除') return
  // 乐观更新，不await了
  reqDelComponent(compKey)
  window.__cpw_categories.value[cateIdx]?.children.splice(compIdx, 1)
}

</script>
