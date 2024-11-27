<template>
  <div style="height: 100%; width: 100%; overflow: auto;">
    <button @click="run">run</button>
    <div
      v-for="cell in cells"
      :key="cell.id"
      style="margin: 20px;"
    >
      <div style="background-color: #222;">{{ cell.source }}</div>
      <hr />
      <div :id="cell.id" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import { dispatchAction } from './actionEvent'

const props = defineProps<{
  id: string
  fileContent: any
 }>()

// 整个fileContent会在初始化时传入，并且不会变更，只有vue应用会单向往widget传递最新的fileContnet
const cells = reactive<CPW.Cell[]>(props.fileContent.graph.cells)

const run = () => {
  const runnerCells = cells.map<CPW.RunnerCell>(cell => {
    return {
      id: cell.id,
      // @ts-ignore
      code: typeof cell.source === 'string' ? cell.source : cell.source.join(''),
    }
  })
  dispatchAction(props.id, { type: 'run', data: { cells: runnerCells } })
}

const listeners = {
  updateCell (payload: CPW.EventPayloadData['updateCell']) {
    const cell = cells.find(({ id }) => id === payload.id)
    if (cell) cell.outputs = payload.outputs
  },
  kernelStatus () {

  },
}

const listener = (e: CustomEvent<CPW.EventPayload<CPW.EventType>>) => {
  listeners[e.detail.type]?.(e.detail.data as any)
}

window.addEventListener(`cpw-event-${props.id}`, listener as any)
</script>

<style lang="scss" scoped>

</style>
