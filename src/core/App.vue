<template>
  <div class="cpw-renderer">
    <div class="cpw-dnd">
      <!--  -->
    </div>
    <div
      ref="graphDom"
      style="height: 100%; width: 100%;"
    />
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        ref="contextMenuDom"
        class="cpw-contextmenu lm-Menu"
        :style="`--jp-border-width: 1px; left: ${contextMenu.x}px; top: ${contextMenu.y}px`"
      >
        <div
          v-for="item in contextMenu.items"
          :key="item.label"
          class="cpw-contextmenu-item"
          :style="`--item-height: ${contextMenuItemHeight}px; item-width: ${contextMenuItemWidth}px`"
          @click="e => { item.onClick(e); contextMenu.visible = false }"
        >
          {{ item.label }}
        </div>
      </div>
    </Teleport>
    <!-- <ContextMenu v-if="contextMenu" /> -->
    <!-- <div /> -->
    <!-- <button @click="run">run</button>
    <div>{{ kernelStatus }}</div>
    <div
      v-for="cell in cells"
      :key="cell.id"
      style="margin: 20px;"
    >
      <hr />
      <div>{{ cell.status }}</div>
      <textarea
        v-model="cell.source"
        @input="contentChange"
      />
      <template v-if="cell.status !== 'running' && cell.node">
        <hr />
        <button @click="showOutput(cell)">show output</button>
        <div :id="cell.id" />
      </template>
    </div> -->
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance, onMounted, ref, shallowRef } from 'vue'
import { dispatchAction } from './actionEvent'
import type { Kernel } from '@jupyterlab/services'
import { Graph, Cell } from '@antv/x6'
import { initGraph, getContextMenuPosition, contextMenuItemHeight, contextMenuItemWidth } from './graph'

const props = defineProps<{
  id: string
  fileContent: CPW.FileSchema
 }>()

const app = getCurrentInstance()?.appContext.app

const contextMenuDom = shallowRef<HTMLDivElement>()

const graphDom = shallowRef<HTMLDivElement>()

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  items: [] as CPW.ContextMenuItem[],
})

const showMenu = (e: { clientX: number, clientY: number }, items: CPW.ContextMenuItem[]) => {
  contextMenu.value = {
    items,
    visible: true,
    ...getContextMenuPosition(items.length, { x: e.clientX, y: e.clientY }),
  }
}

let graph: Graph

onMounted(() => {
  graph = initGraph(graphDom.value!)

  graph.on('node:click', (e) => {
    if (e.node.shape !== 'cpw-cell-node') return
    if (e.node.getData().active) return
    graph.getNodes().forEach(node => {
      if (e.node.shape !== 'cpw-cell-node') return
      updateCellData(node, { active: false })
      // todo 更新outputs
    })
    updateCellData(e.node, { active: true })
  })

  graph.on('blank:contextmenu', ({ e }) => {
    showMenu(e, [{ label: '运行所有', onClick: () => run('all') }])
  })

  graph.on('edge:contextmenu', ({ e, edge }) => {
    showMenu(e, [{ label: '删除连接', onClick: () => delCell(edge) }])
  })

  graph.on('node:contextmenu', ({ e, node }) => {
    showMenu(
      e,
      [
        { label: '运行节点', onClick: () => run('single', node.id) },
        { label: '运行至所选节点', onClick: () => run('to-current', node.id) },
        { label: '运行所有', onClick: () => run('all') },
        { label: '删除节点', onClick: () => delCell(node) },
      ],
    )
  })

  // 整个fileContent会在初始化时传入，并且不会变更，只有vue应用会单向往widget传递最新的fileContnet
  graph.fromJSON({ cells: props.fileContent.cells })

  graph.addNode({
    shape: 'cpw-cell-node',
    x: 100,
    y: 600,
    data: { status: 'done', name: '123' } as CPW.Cell,
  })

  graph.addNode({
    shape: 'cpw-cell-node',
    x: 50,
    y: 500,
    data: { name: '456' } as CPW.Cell,
  })

  graph.addNode({
    shape: 'cpw-cell-node',
    x: 40,
    y: 400,
    data: { name: 'fff' } as CPW.Cell,
  })

  graph.centerContent()
})

const updateCellData = (target: string | Cell, data: Partial<CPW.Cell>) => {
  const cell = typeof target === 'string' ? graph.getCellById(target) : target
  if (cell) cell.setData(data, { deep: false })
}

const delCell = (target: string | Cell) => {
  const cell = graph.removeCell(target as any)
  cell?.dispose()
  return cell
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

// const showOutput = (cell: CPW.Cell) => {
//   document.getElementById(cell.id)?.appendChild(cell.node!)
// }

const contentChange = () => {
  // const
  // dispatchAction(props.id, { type: 'change', data: { content: JSON.stringify({ graph: { cells } }) } })
  dispatchAction(props.id, { type: 'change', data: { content: JSON.stringify({ cells: graph.getCells() }) } })
}

const kernelStatus = ref<Kernel.Status>('unknown')
let timer = 0
const pollKernelStatus = () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    dispatchAction(props.id, { type: 'kernelStatus', data: null })
    pollKernelStatus()
  }, 100)
}

const docMouseDown = (e: MouseEvent) => {
  if (!contextMenuDom.value?.contains(e.target as any)) contextMenu.value.visible = false
}

onMounted(() => {
  pollKernelStatus()
  window.addEventListener('mousedown', docMouseDown)
})

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const eventHandlers: Record<CPW.EventType, Function> = {
  cellOutputs ({ id, outputs, node }: CPW.EventPayloadData['cellOutputs']) {
    if (outputs.length) return
    updateCellData(id, { outputs, node })
    contentChange()
  },
  cellStatus ({ id, status }: CPW.EventPayloadData['cellStatus']) {
    updateCellData(id, { status })
    contentChange()
  },
  kernelStatus (payload: CPW.EventPayloadData['kernelStatus']) {
    kernelStatus.value = payload.status
  },
  dispose () {
    window.removeEventListener(`cpw-event-${props.id}`, listener as any)
    window.removeEventListener('mousedown', docMouseDown)
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
