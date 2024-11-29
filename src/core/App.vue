<template>
  <div class="cpw-renderer">
    <div class="cpw-dnd">
      <!--  -->
    </div>
    <div
      ref="dom"
      style="height: 100%;"
    />
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
import { getCurrentInstance, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef } from 'vue'
import { dispatchAction } from './actionEvent'
import type { Kernel } from '@jupyterlab/services'
import { Graph } from '@antv/x6'
import { initGraph } from './graph'

const props = defineProps<{
  id: string
  fileContent: any
 }>()

const app = getCurrentInstance()?.appContext.app

// 整个fileContent会在初始化时传入，并且不会变更，只有vue应用会单向往widget传递最新的fileContnet
const cells = reactive<CPW.Cell[]>(props.fileContent.graph.cells)

const dom = useTemplateRef('dom')

let graph: Graph
onMounted(() => {
  graph = initGraph(dom.value!)
  graph.on('node:click', (a) => console.log(a))
  graph.fromJSON({ cells: [] })

  graph.addNode({
    shape: 'cpw-cell-node',
    x: 100,
    y: 600,
    data: {
      name: '啊实打实的',
      status: 'running',
    },
  })

  setTimeout(() => {
    graph.getNodes()[0].setData({ name: '12321', status: 'done' }, { deep: false })
  }, 3000)
})

const kernelStatus = ref<Kernel.Status>('unknown')

const run = () => {
  // todo流水线解析分支运行
  const runnerCells = cells.map<CPW.RunnerCell>(cell => {
    cell.status = 'waiting'
    return {
      id: cell.id,
      // @ts-ignore
      code: typeof cell.source === 'string' ? cell.source : cell.source.join(''),
    }
  })
  dispatchAction(props.id, { type: 'run', data: { cells: runnerCells } })
}

const showOutput = (cell: CPW.Cell) => {
  document.getElementById(cell.id)?.appendChild(cell.node!)
}

const contentChange = () => {
  dispatchAction(props.id, { type: 'change', data: { content: JSON.stringify({ graph: { cells } }) } })
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const eventHandlers: Record<CPW.EventType, Function> = {
  updateCellOutputs (payload: CPW.EventPayloadData['updateCellOutputs']) {
    if (!payload.outputs.length) return
    const cell = cells.find(({ id }) => id === payload.id)
    if (!cell) return
    cell.outputs = payload.outputs
    cell.node = payload.node
    contentChange()
  },
  updateCellStatus (payload: CPW.EventPayloadData['updateCellStatus']) {
    const cell = cells.find(({ id }) => id === payload.id)
    if (!cell) return
    cell.status = payload.status
    contentChange()
  },
  kernelStatus (payload: CPW.EventPayloadData['kernelStatus']) {
    kernelStatus.value = payload.status
  },
  dispose () {
    app?.unmount()
    window.removeEventListener(`cpw-event-${props.id}`, listener as any)
  },
}

const listener = (e: CustomEvent<CPW.EventPayload<CPW.EventType>>) => {
  eventHandlers[e.detail.type]?.(e.detail.data as any)
}

window.addEventListener(`cpw-event-${props.id}`, listener as any)

let timer = 0
const pollKernelStatus = () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    dispatchAction(props.id, { type: 'kernelStatus', data: null })
    pollKernelStatus()
  }, 100)
}

onMounted(pollKernelStatus)
onBeforeUnmount(() => clearTimeout(timer))
</script>
