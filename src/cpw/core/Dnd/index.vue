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
      <Cate
        :cate="bookmark_cate"
        bookmark
      />
      <Cate
        v-for="cate, cateIdx in list"
        :key="cate.id"
        :cate="cate"
        :idx="cateIdx"
      />
    </t-loading>
    <CellEditor
      ref="_CellEditor"
      @done="emit('refreshCategory')"
    />
  </div>
</template>

<script lang="tsx" setup>
import type { Dnd } from '@antv/x6-plugin-dnd'
import type { Graph } from '@antv/x6'
import { ref, defineExpose, onBeforeUnmount, computed, useTemplateRef } from 'vue'
import { initDnd } from '../Graph'
import { formatCellParams, formatCellIncomes, formatCellOutgos } from '../cellHandlers'
import { Input as TInput, Button as TButton, Loading as TLoading, Popup as TPopup } from 'tdesign-vue-next'
import { watchDebounced } from '@vueuse/core'
import { PlusIcon, ChevronRightIcon, StarIcon, StarFilledIcon } from 'tdesign-icons-vue-next'
import CellEditor from '../CellEditor/index.vue'
import { Dialog, showDialog } from '@jupyterlab/apputils'
import { reqBookmarkComponent, reqDelComponent, reqUnBookmarkComponent } from '../api'

const emit = defineEmits(['refreshCategory'])

let dnd: Dnd

const dndDom = useTemplateRef('_dndDom')

const dndExpanded = ref<Record<string, boolean>>({})

const toggleExpand = (id: string) => {
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

const categories = computed(() => window.__CPW_DATA.categories.value)
const categories_loading = computed(() => window.__CPW_DATA.categories_loading.value)
const bookmark_ids = computed(() => window.__CPW_DATA.bookmark_component_ids.value)

const BOOKMARK_CATE_ID = '__bookmark__'
const bookmark_cate = computed(() => {
  const res: CPW.CellCategory = {
    id: BOOKMARK_CATE_ID,
    name: '我收藏的组件',
    children: [],
  }
  categories.value.forEach(cate => {
    cate.children.forEach(comp => {
      if (
        bookmark_ids.value.includes(comp.key) &&
        (dbKeyword.value ? comp.name.toLowerCase().includes(dbKeyword.value) : true)
      ) res.children.push(comp)
    })
  })

  return res
})

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
  window.__CPW_DATA.categories.value[cateIdx]?.children.splice(compIdx, 1)
}

const setBookmark = (bool: boolean, compKey: number) => {
  // 乐光更新
  if (bool) {
    reqBookmarkComponent(compKey)
    window.__CPW_DATA.bookmark_component_ids.value.unshift(compKey)
  } else {
    reqUnBookmarkComponent(compKey)
    window.__CPW_DATA.bookmark_component_ids.value = window.__CPW_DATA.bookmark_component_ids.value.filter(id => id !== compKey)
  }
}

const Cate = ({ cate, idx, bookmark }: { cate: CPW.CellCategory, idx?: number, bookmark?: boolean }) => {
  const isExpanded = dbKeyword.value ? true : dndExpanded.value[cate.id]
  return <>
    <div
      class="cpw-dnd-category"
      title={cate.name}
      onClick={() => toggleExpand(cate.id)}
    >
      {/* @ts-ignore */}
      <ChevronRightIcon class="cpw-dnd-category-icon" expanded={isExpanded} />
      <div class="cpw-dnd-category-label">{cate.name}</div>
    </div>
    {
      isExpanded && cate.children.map((comp, compIdx) => <TPopup
        key={comp.key}
        placement="right-top"
        overlayInnerStyle={{ width: '300px', padding: '8px 12px' }}
        showArrow
      >
        {{
          content: () => <>
            {comp.desc ? <div>{comp.desc}</div> : <div style="color: var(--td-text-color-secondary)">组件无描述</div>}
            <div style="display: flex; justify-content: flex-end; padding-top: 12px;">
              {
                bookmark_ids.value.includes(comp.key)
                  ? <TButton
                    content="取消收藏"
                    variant="text"
                    size="small"
                    style="--td-text-color-primary: #f1f134"
                    onClick={() => setBookmark(false, comp.key)}
                  >
                    {{ icon: () => <StarFilledIcon /> }}
                  </TButton>
                  : (
                    !bookmark && <TButton
                      content="收藏"
                      variant="text"
                      size="small"
                      style="--td-text-color-primary: #f1f134"
                      onClick={() => setBookmark(true, comp.key)}
                    >
                      {{ icon: () => <StarIcon /> }}
                    </TButton>
                  )
              }
              {!bookmark && <TButton content="删除" variant="text" theme="danger" size="small" onClick={() => del(comp.key, compIdx, idx!)} />}
            </div>
          </>,

          default: () => <div class="cpw-dnd-component" title={comp.name} onMousedown={e => startDrag(e, comp)} >{comp.name}</div>,
        }}
      </TPopup>)
    }
  </>
}
</script>
