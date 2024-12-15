<template>
  <div
    ref="_containerDom"
    class="cpw-outputs"
    :style="`--resize-height: ${resizeHeight}px`"
    :expanded="expanded"
  >
    <div class="cpw-outputs-header">
      <div
        ref="_resizerDom"
        class="cpw-outputs-header-resizer"
      />

      <div class="cpw-outputs-header-content">
        <div style="display: flex; align-items: center; flex-wrap: nowrap; column-gap: 16px;">
          <template v-if="activeCell">
            <div
              style="display: flex; align-items: center;"
              :title="activeCell.name"
            >
              <div>组件:&nbsp;</div>
              <div
                style="max-width: 400px;"
                class="ellipsis-1"
              >
                {{ activeCell.name }}
              </div>
            </div>
            <div>状态:&nbsp;{{ activeCell.status }}</div>
          </template>

          <div v-else>请选择组件</div>

          <t-button
            :content="expanded ? '收起' : '展开'"
            variant="text"
            size="small"
            style="margin-left: auto; flex-shrink: 0;"
            @click="expanded = !expanded"
          >
            <template #icon><ChevronDownCircleIcon v-if="expanded" /><ChevronUpCircleIcon v-else /></template>
          </t-button>
        </div>
      </div>
    </div>

    <div
      ref="_renderDom"
      class="cpw-outputs-render"
    />
  </div>
</template>

<script lang="ts" setup>
import { useTemplateRef, watch, ref, onMounted, onBeforeUnmount, defineModel } from 'vue'
import { Button as TButton } from 'tdesign-vue-next'
import { ChevronUpCircleIcon, ChevronDownCircleIcon } from 'tdesign-icons-vue-next'
import { dispatchAction } from '../utils'
import { useThrottleFn } from '@vueuse/core'

const props = defineProps<{
  activeCell: CPW.Cell | null
  id: string
}>()
const containerDom = useTemplateRef('_containerDom')
const resizerDom = useTemplateRef('_resizerDom')
const renderDom = useTemplateRef('_renderDom')

const empty = (str: string) => `<div>${str}</div>`

// 数据流-activeCell非常频繁更改导致多次重复渲染
const updateOutputsRender = useThrottleFn(
  () => {
    if (!props.activeCell) {
      renderDom.value!.innerHTML = empty('当前无选中组件')
      return
    }
    const { id, outputs, node } = props.activeCell
    if (node) {
      renderDom.value!.textContent = ''
      renderDom.value!.appendChild(node)
    } else {
      renderDom.value!.innerHTML = empty('当前组件无输出')
      // 如果节点有outputs但是没node，表示是重新打开的文件，需要渲染outputs数组
      if (outputs.length) dispatchAction(props.id, { type: 'renderOutputs', data: { id, outputs } })
    }
  },
  150,
  true,
  false,
)

// const updateOutputsRender = () => {
//   console.log(111)
//   if (!props.activeCell) {
//       renderDom.value!.innerHTML = empty('当前无选中组件')
//       return
//   }
//   const { id, outputs, node } = props.activeCell
//   if (node) {
//       renderDom.value!.textContent = ''
//       renderDom.value!.appendChild(node)
//   } else {
//       renderDom.value!.innerHTML = empty('当前组件无输出')
//       // 如果节点有outputs但是没node，表示是重新打开的文件，需要渲染outputs数组
//       if (outputs.length) dispatchAction(props.id, { type: 'renderOutputs', data: { id, outputs } })
//   }
// }

watch(() => props.activeCell, updateOutputsRender)
onMounted(updateOutputsRender)

const expanded = defineModel<boolean>('expanded', { required: true })
// const expanded = ref(false)

let defaultHeight = 200

const storageKey = 'cpw-outputs-height'
const storageVal = localStorage.getItem(storageKey)

if (storageVal) defaultHeight = parseFloat(storageVal) || defaultHeight

let startY = 0
let startHeight = 0
let maxHeight = 0
const minHeight = 150
const resizeHeight = ref(defaultHeight) // 默认展开高度200

const startDrag = (e: MouseEvent) => {
  if (!expanded.value) return
  e.preventDefault()
  startY = e.pageY
  startHeight = containerDom.value!.offsetHeight
  const parent = containerDom.value!.offsetParent!
  const { paddingTop, paddingBottom } = getComputedStyle(parent)
  maxHeight = parent.clientHeight - (parseFloat(paddingTop) || 0) - (parseFloat(paddingBottom) || 0)
  window.addEventListener('mousemove', dragging)
  window.addEventListener(
    'mouseup',
    () => {
      window.removeEventListener('mousemove', dragging)
      localStorage.setItem(storageKey, resizeHeight.value + '')
    },
    { once: true },
  )
}

const dragging = (e: MouseEvent) => {
  const offset = startY - e.pageY
  let height = startHeight + offset
  if (height > maxHeight) height = maxHeight
  else if (height < minHeight) height = minHeight
  resizeHeight.value = height
}

onMounted(() => resizerDom.value!.addEventListener('mousedown', startDrag))
onBeforeUnmount(() => resizerDom.value!.removeEventListener('mousedown', startDrag))

</script>
