<template>
  <div class="cpw-container">
    <!-- eslint-disable vue/no-v-html -->
    <Toolbar
      :btns="toolbarBtns"
      :kernel-status="kernelStatus"
    />

    <div class="cpw-graph-warpper">
      <div
        ref="dndDom"
        :class="['cpw-dnd', dndCollapsed && 'cpw-dnd-collapsed']"
      >
        <template
          v-for="cate in nodeCategory"
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

      <div
        ref="graphDom"
        class="cpw-graph"
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
import { computed, getCurrentInstance, onMounted, reactive, ref, shallowRef } from 'vue'
import { dispatchAction, btnIcons, type ToolbarBtn, nodeCategory, type NodeComponent } from './utils'
import type { Kernel } from '@jupyterlab/services'
import { Graph, Cell } from '@antv/x6'
import { initGraph, initDnd, getContextMenuPosition, contextMenuItemHeight, contextMenuItemWidth, type ContextMenuItem } from './Graph'
// import { throttle } from 'lodash-es'
import Toolbar from './Toolbar/index.vue'
import { Dnd } from '@antv/x6-plugin-dnd'

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

const graphDom = shallowRef<HTMLDivElement>()
let graph: Graph
let dnd: Dnd

const dndDom = ref<HTMLDivElement>()
const dndCollapsed = ref(false)
const dndExpanded = reactive<Record<string, boolean>>({})
const toogleExpand = (id: string) => {
  if (dndExpanded[id]) delete dndExpanded[id]
  else dndExpanded[id] = true
}

const startDrag = (e: MouseEvent, item: NodeComponent) => {
  const { key, name, source } = item
  const node = graph.createNode({
    shape: 'cpw-cell-node',
    data: { key, name, source } as CPW.Cell,
  })
  dnd.start(node, e)
}

onMounted(() => {
  graph = initGraph(graphDom.value!)
  dnd = initDnd(graph, dndDom.value!)
  // * ----- 单选激活节点 ------
  graph.on('blank:click', () => clearActive())
  graph.on('cell:click', (e) => {
    if (e.cell.shape !== 'cpw-cell-node') {
      clearActive()
      return
    }
    if (activeNodeId.value === e.cell.id) return
    clearActive()
    updateCellData(e.cell, { active: true })
    activeNodeId.value = e.cell.id
    // todo 更新outputs
  })

  // todo: node:dbclick打开outputs抽屉

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

const activeNodeId = ref('')
const clearActive = () => {
  if (!activeNodeId.value) return
  updateCellData(activeNodeId.value, { active: false })
  activeNodeId.value = ''
}

const updateCellData = (target: string | Cell, data: Partial<CPW.Cell>) => {
  const cell = typeof target === 'string' ? graph.getCellById(target) : target
  if (cell) cell.setData(data, { deep: false, overwrite: false })
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
  updateCellData(newCell, { outputs: [], active: false, node: undefined, status: 'changed' })
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
  // todo 清除输出抽屉
}

// const showOutput = (cell: CPW.Cell) => {
//   document.getElementById(cell.id)?.appendChild(cell.node!)
// }

// const contentChange = throttle(
//   () => {
//     const json = graph.toJSON()
//     json.cells.forEach(cell => { if (cell.shape === 'cpw-cell-node') delete cell.data.node })
//     dispatchAction(props.id, { type: 'change', data: { content: JSON.stringify(json) } })
//   },
//   100,
// )
// * ---------------- toolbar --------------------
const toolbarBtns = computed<ToolbarBtn[]>(() => {
  const noActive = !activeNodeId.value
  return [
    dndCollapsed.value
      ? { title: '展开组件列表', icon: 'menuClose', onClick: () => { dndCollapsed.value = false } }
      : { title: '收起组件列表', icon: 'menuOpen', onClick: () => { dndCollapsed.value = true } },
    { title: '保存', icon: 'save', onClick: () => dispatchAction(props.id, { type: 'save', data: null }) },
    { title: '复制节点', icon: 'copy', disabled: noActive, onClick: () => copyCell(activeNodeId.value) },
    { title: '运行节点', icon: 'runSignal', disabled: noActive, onClick: () => run('single', activeNodeId.value) },
    { title: '运行至所选', icon: 'runToCurrent', disabled: noActive, onClick: () => run('to-current', activeNodeId.value) },
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
    // if (outputs.length) return
    updateCellData(id, { outputs, node })
    // contentChange()
  },
  cellStatus ({ id, status }: CPW.EventPayloadData['cellStatus']) {
    updateCellData(id, { status })
    // contentChange()
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
