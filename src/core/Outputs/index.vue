<template>
  <div
    ref="containerDom"
    class="cpw-outputs"
    :style="`--resize-height: ${resizeHeight}px`"
    :expanded="expanded"
  >
    <div class="cpw-outputs-header">
      <div
        ref="resizerDom"
        class="cpw-outputs-header-resizer"
      />

      <div class="cpw-outputs-header-content">
        <template v-if="activeCell">
          <div>组件: {{ activeCell.name }}</div>
          <div>状态: {{ activeCell.status }}</div>
        </template>
        <div v-else>请选择组件</div>

        <t-button
          :content="expanded ? '收起' : '展开'"
          variant="text"
          size="small"
          style="margin-left: auto;"
          @click="expanded = !expanded"
        >
          <template #icon><ChevronDownCircleIcon v-if="expanded" /><ChevronUpCircleIcon v-else /></template>
        </t-button>
      </div>
    </div>

    <div
      ref="renderDom"
      class="cpw-outputs-render"
    />
  </div>
</template>

<script lang="ts" setup>
import { shallowRef, watch, ref, onMounted, onBeforeUnmount } from 'vue'
import { Button as TButton } from 'tdesign-vue-next'
import { ChevronUpCircleIcon, ChevronDownCircleIcon } from 'tdesign-icons-vue-next'

const props = defineProps<{ activeCell: CPW.Cell | null }>()
const containerDom = shallowRef<HTMLDivElement>()
const resizerDom = shallowRef<HTMLDivElement>()
const renderDom = shallowRef<HTMLDivElement>()

const empty = (str: string) => `<div style="height: 100%; display: flex; justify-content: center; align-items: center;">${str}</div>`

const updateOutputsRender = () => {
  if (props.activeCell) {
    if (props.activeCell.node) {
      renderDom.value!.textContent = ''
      renderDom.value!.appendChild(props.activeCell.node)
    } else {
      renderDom.value!.innerHTML = empty('当前组件无输出, 请运行')
    }
  } else {
    renderDom.value!.innerHTML = empty('当前无选中组件')
  }
}

watch(() => props.activeCell, updateOutputsRender)
onMounted(updateOutputsRender)

// const expanded = defineModel<boolean>('expanded', { required: true })
const expanded = ref(false)

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
