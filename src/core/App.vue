<template>
  <div class="cpw-container">
    <!-- eslint-disable vue/no-v-html -->
    <Toolbar
      :btns="toolbarBtns"
      :kernel-status="kernelStatus"
    />

    <div class="cpw-graph-warpper">
      <Dnd
        ref="dndRef"
        :collapsed="dndCollapsed"
      />

      <div
        ref="graphDom"
        class="cpw-graph"
      />

      <Outputs
        :id="id"
        v-model:expanded="outputsVisible"
        :dnd-collapsed="dndCollapsed"
        :active-cell="activeCell"
      />
    </div>

    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        ref="contextMenuDom"
        class="cpw-contextmenu lm-Menu"
        :style="`--jp-border-width: 1px; left: ${contextMenu.x}px; top: ${contextMenu.y}px`"
      >
        <template
          v-for="item, i in contextMenu.items"
          :key="i"
        >
          <div
            v-if="item.divider"
            class="cpw-contextmenu-divider"
          />
          <div
            v-else
            class="cpw-contextmenu-item"
            :style="`--item-height: ${contextMenuItemHeight}px; --item-width: ${contextMenuItemWidth}px`"
            :title="item.label"
            @click="e => { item.onClick?.(e); contextMenu.visible = false }"
          >
            <div
              class="cpw-contextmenu-item-icon"
              :style="`--item-icon-size: ${Math.floor(contextMenuItemHeight * 0.67)}px`"
              v-html="btnIcons[item.icon!] || ''"
            />
            <div class="cpw-contextmenu-item-label">{{ item.label }}</div>
          </div>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { computed, getCurrentInstance, onMounted, ref, shallowRef } from 'vue'
import { dispatchAction, btnIcons, type ToolbarBtn } from './utils'
import type { Kernel } from '@jupyterlab/services'
import type { Graph, Cell } from '@antv/x6'
import { initGraph, getContextMenuPosition, contextMenuItemHeight, contextMenuItemWidth, type ContextMenuItem } from './Graph'
// import { throttle } from 'lodash-es'
import Toolbar from './Toolbar/index.vue'
import { useThrottleFn } from '@vueuse/core'
// import { Dnd } from '@antv/x6-plugin-dnd'
import Dnd from './Dnd/index.vue'
import Outputs from './Outputs/index.vue'

const props = defineProps<{
  id: string
  fileContent: CPW.FileSchema
 }>()

const app = getCurrentInstance()?.appContext.app

const contextMenuDom = shallowRef<HTMLDivElement>()

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
})

const showMenu = (e: { clientX: number, clientY: number }, items: ContextMenuItem[]) => {
  contextMenu.value = {
    items,
    visible: true,
    ...getContextMenuPosition(items, { x: e.clientX, y: e.clientY }),
  }
}

const outputsVisible = ref(false)

const graphDom = shallowRef<HTMLDivElement>()
let graph: Graph

const dndRef = shallowRef<InstanceType<typeof Dnd>>()
const dndCollapsed = ref(false)

onMounted(() => {
  graph = initGraph(graphDom.value!)
  // window.graph = graph
  dndRef.value!.init(graph)
  // dnd = initDnd(graph, dndDom.value!)

  graph.on('node:added', fileChange)
  graph.on('node:moved', fileChange)
  graph.on('cell:removed', fileChange)
  graph.on('edge:connected', fileChange)
  /** 因为graph.fromJSON会触发这个node:change:data事件导致一打开文件就是修改状态，data变更的fileChange改为在updateCellData中调用 */
  // graph.on('node:change:data', fileChange)

  // * ----- 单选激活节点 ------
  graph.on('blank:click', () => setActive(null))
  graph.on('cell:click', (e) => e.cell.shape === 'cpw-cell-node' ? setActive(e.cell) : setActive(null))

  // 触发双击之前会先触发单击事件，此时是会有active的
  graph.on('node:dblclick', e => { if (e.cell.shape === 'cpw-cell-node') outputsVisible.value = true })

  // * ----- 右键菜单 ------
  graph.on('blank:contextmenu', ({ e }) => {
    showMenu(
      e,
      [
        { label: '运行所有', icon: 'runAll', onClick: () => run('all') },
        { divider: true },
        { label: '清除所有节点输出', onClick: () => clearOutputs('all') },
      ],
    )
  })

  graph.on('edge:contextmenu', ({ e, edge }) => {
    showMenu(e, [{ label: '删除连接', icon: 'delete', onClick: () => delCell(edge) }])
  })

  graph.on('node:contextmenu', ({ e, node }) => {
    showMenu(
      e,
      [
        { label: '运行节点', icon: 'runSignal', onClick: () => run('single', node.id) },
        { label: '运行至所选节点', icon: 'runToCurrent', onClick: () => run('to-current', node.id) },
        { label: '运行所有', icon: 'runAll', onClick: () => run('all') },
        { divider: true },
        { label: '清除节点输出', onClick: () => clearOutputs('single', node) },
        { label: '清除所有节点输出', onClick: () => clearOutputs('all') },
        { divider: true },
        { label: '复制节点', icon: 'copy', onClick: () => copyCell(node) },
        { label: '删除节点', icon: 'delete', onClick: () => delCell(node) },
      ],
    )
  })

  // 整个fileContent会在初始化时传入，并且不会变更，只有vue应用会单向往widget传递最新的fileContnet
  graph.fromJSON({ cells: props.fileContent.cells })
})

// * ------------------- 节点操作 -------------------
// const activeNodeId = ref('')
const activeCell = shallowRef<CPW.Cell | null>(null)

const setActive = (target: string | Cell | null) => {
  if (target) {
    const cell = typeof target === 'string' ? graph.getCellById(target) : target
    if (cell?.shape !== 'cpw-cell-node') return
    if (activeCell.value && activeCell.value?.id !== cell.id) updateCellData(activeCell.value.id, { active: false })
    updateCellData(cell, { active: true })
    activeCell.value = { ...cell.getData() as CPW.Cell }
  } else {
    if (!activeCell.value) return
    updateCellData(activeCell.value.id, { active: false })
    activeCell.value = null
  }
}

const updateCellData = (target: string | Cell, data: Partial<CPW.Cell>) => {
  const cell = typeof target === 'string' ? graph.getCellById(target) : target
  if (!cell) return
  cell.setData(data, { deep: false, overwrite: false })
  if (activeCell.value?.id === cell.id) activeCell.value = { ...cell.getData() as CPW.Cell }
  fileChange()
}

const delCell = (target: string | Cell) => {
  const cell = graph.removeCell(target as any)
  cell?.dispose()
  return cell
}

const copyCell = (target: string | Cell) => {
  const cell = typeof target === 'string' ? graph.getCellById(target) : target
  if (!cell || cell.shape !== 'cpw-cell-node') return
  graph.copy([cell])
  const [newCell] = graph.paste()
  updateCellData(newCell, { id: newCell.id, outputs: [], active: false, node: undefined, status: 'changed' })
  graph.cleanClipboard()
}

const run = (type: CPW.RunType, id?: string) => {
  if (kernelStatus.value !== 'idle') {
    // todo 提示
    return
  }
  const runnerCells: CPW.RunnerCell[] = []
  if (type === 'all') {
    // 分析所有
  } else if (type === 'to-current' && id) {
    // 分析所有至当前节点
  } else if (type === 'single' && id) {
    // 运行当前节点
    const node = graph.getCellById(id)
    const { source } = node.getData<CPW.Cell>()
    updateCellData(node, { status: 'waiting' })
    runnerCells.push({ id, code: source })
  }
  // todo流水线解析分支运行
  // const runnerCells = cells.map<CPW.RunnerCell>(cell => {
  //   cell.status = 'waiting'
  //   return {
  //     id: cell.id,
  //     // @ts-ignore
  //     code: typeof cell.source === 'string' ? cell.source : cell.source.join(''),
  //   }
  // })
  dispatchAction(props.id, { type: 'run', data: { cells: runnerCells } })
}

const clearOutputs = (type: 'single' | 'all', target?: string | Cell) => {
  if (type === 'single' && target) {
    const cell = typeof target === 'string' ? graph.getCellById(target) : target
    if (cell) updateCellData(cell, { outputs: [], node: undefined })
  } else {
    graph.getCells().forEach(node => {
      if (node.shape === 'cpw-cell-node') updateCellData(node, { outputs: [], node: undefined })
    })
  }
}

const fileChange = useThrottleFn(
  () => {
    const json = graph.toJSON()
    json.cells.forEach(cell => {
      if (cell.shape === 'cpw-cell-node') {
        delete cell.data.node
        cell.data.active = false
        // 不保存节点运行中的状态
        if (cell.data.status === 'running' || cell.data.status === 'waiting') cell.data.status = 'changed'
      }
    })
    dispatchAction(props.id, { type: 'change', data: { content: JSON.stringify(json) } })
  },
  100,
)

// * ---------------- toolbar --------------------
const toolbarBtns = computed<ToolbarBtn[]>(() => {
  const noActive = !activeCell.value
  return [
    dndCollapsed.value
      ? { title: '展开组件列表', icon: 'menuClose', onClick: () => { dndCollapsed.value = false } }
      : { title: '收起组件列表', icon: 'menuOpen', onClick: () => { dndCollapsed.value = true } },
    { title: '保存', icon: 'save', onClick: () => dispatchAction(props.id, { type: 'save', data: null }) },
    { title: '复制节点', icon: 'copy', disabled: noActive, onClick: () => copyCell(activeCell.value!.id) },
    { title: '运行节点', icon: 'runSignal', disabled: noActive, onClick: () => run('single', activeCell.value!.id) },
    { title: '运行至所选', icon: 'runToCurrent', disabled: noActive, onClick: () => run('to-current', activeCell.value!.id) },
    { title: '运行所有', icon: 'runAll', onClick: () => run('all') },
    { title: '中止内核', icon: 'stop', onClick: () => dispatchAction(props.id, { type: 'kernelInterrupt', data: null }) },
    { title: '重启内核', icon: 'restart', onClick: () => dispatchAction(props.id, { type: 'kernelResert', data: null }) },
  ]
})

// * ------- 内核状态轮询 -------
const kernelStatus = ref<Kernel.Status>('starting')
let timer = 0
const pollKernelStatus = () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    dispatchAction(props.id, { type: 'kernelStatus', data: null })
    pollKernelStatus()
  }, 100)
}

const closeContextMenu = (e: MouseEvent) => {
  if (!contextMenuDom.value?.contains(e.target as any)) contextMenu.value.visible = false
}

onMounted(() => {
  pollKernelStatus()
  window.addEventListener('mousedown', closeContextMenu)
})

// * ------- widget事件接收 --------------
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const eventHandlers: Record<CPW.EventType, Function> = {
  cellOutputs ({ id, outputs, node }: CPW.EventPayloadData['cellOutputs']) {
    updateCellData(id, { outputs, node })
  },
  cellStatus ({ id, status }: CPW.EventPayloadData['cellStatus']) {
    updateCellData(id, { status })
  },
  kernelStatus (payload: CPW.EventPayloadData['kernelStatus']) {
    kernelStatus.value = payload.status
  },
  dispose () {
    window.removeEventListener(`cpw-event-${props.id}`, listener as any)
    window.removeEventListener('mousedown', closeContextMenu)
    graph.dispose()
    clearTimeout(timer)
    app?.unmount()
  },
}

const listener = (e: CustomEvent<CPW.EventPayload<CPW.EventType>>) => {
  eventHandlers[e.detail.type]?.(e.detail.data as any)
}

window.addEventListener(`cpw-event-${props.id}`, listener as any)

</script>
