<template>
  <div class="cpw-container">
    <!-- eslint-disable vue/no-v-html -->
    <Toolbar
      :left="toolbarLeft"
      :right="toolbarRight"
      :kernel-status="kernelStatus"
    />

    <div class="cpw-graph-warpper">
      <Dnd
        ref="_dndRef"
        :collapsed="dndCollapsed"
        @refresh-category="getCellCategories"
      />

      <div
        ref="_graphDom"
        class="cpw-graph"
      />

      <Cfg
        v-if="!!activeCell"
        ref="_cfgRef"
        :key="activeCell.id"
        :active-cell="activeCell"
        :get-predecessors="getPredecessors"
        :collapsed="cfgCollapsed"
        @config-changed="updateCellData"
      />

      <Outputs
        :id="id"
        v-model:expanded="outputsVisible"
        :dnd-collapsed="dndCollapsed"
        :cfg-collapsed="activeCell ? cfgCollapsed : true"
        :active-cell="activeCell"
      />
    </div>

    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        ref="_contextMenuDom"
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
/* eslint-disable no-throw-literal */
import { computed, getCurrentInstance, onMounted, ref, shallowRef, useTemplateRef } from 'vue'
import { dispatchAction, btnIcons, type ToolbarBtn } from './utils'
import { wrapRunnerCode, getRunnerCellsToTarget } from './cellHandlers'
import type { Kernel } from '@jupyterlab/services'
import type { Graph, Cell } from '@antv/x6'
import { initGraph, getContextMenuPosition, contextMenuItemHeight, contextMenuItemWidth, type ContextMenuItem, portConfig } from './Graph'
import Toolbar from './Toolbar/index.vue'
import { useThrottleFn } from '@vueuse/core'
import Dnd from './Dnd/index.vue'
import Outputs from './Outputs/index.vue'
import { showErrorMessage } from '@jupyterlab/apputils'
import Cfg from './Cfg/index.vue'
import { reqCategories } from './api'
import { MessagePlugin } from 'tdesign-vue-next'

const props = defineProps<{
  id: string
  fileContent: CPW.FileSchema
 }>()

const app = getCurrentInstance()?.appContext.app

const contextMenuDom = useTemplateRef('_contextMenuDom')

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

const graphDom = useTemplateRef('_graphDom')
let graph: Graph

const dndRef = useTemplateRef('_dndRef')
const dndCollapsed = ref(false)

const cfgCollapsed = ref(false)
const cfgRef = useTemplateRef('_cfgRef')

onMounted(() => {
  graph = initGraph(graphDom.value!)
  dndRef.value!.init(graph)
  // dnd = initDnd(graph, dndDom.value!)

  graph.on('edge:removed', ({ edge }) => {
    /**
     * edge的移除分几种情况
     * 1.拉了线出来但是没有连接，松开鼠标会消失，这个时候的edge是没有targetCell的，只有坐标
     * 2.已经连接，但是被edge:connected中的回环检测移除，此时edge的data有标记{ cancel: true }
     *
     * 忽略以上两种情况之后，别的情况就是一个已经正常连接的edge被移除，此时判断是否需要更新Cfg组件的输入设置
     */
    if (!activeCell.value) return
    const targetCellId = edge.getTargetCellId() // 注意，已经removed的edge.getTarget()获取不到，只能获取其id
    if (!targetCellId || edge.getData()?.cancel) return
    if (
      activeCell.value.id === targetCellId ||
      graph.isPredecessor(getCell(activeCell.value.id), getCell(targetCellId))
    ) cfgRef.value?.incomeUpdater()
  })
  graph.on('edge:connected', ({ edge }) => {
    if (edge.disposed) return // edge:connected会先执行在initGraph时注册的相同事件判断连接是否合法
    // 如果新增的连线目标是当前激活组件或是其前序组件，则需要更新Cfg的输入设置
    try {
      if (!activeCell.value) throw ''
      const targetCell = edge.getTargetCell()
      if (!targetCell) throw ''
      if (
        activeCell.value.id === targetCell.id ||
        graph.isPredecessor(getCell(activeCell.value.id), targetCell)
      ) cfgRef.value?.incomeUpdater()
    } catch {
    } finally {
      fileChange()
    }
  })
  graph.on('node:added', fileChange)
  graph.on('node:moved', fileChange)
  graph.on('cell:removed', fileChange)
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
        { label: '清除所有组件输出', onClick: () => clearOutputs('all') },
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
        { label: '运行组件', icon: 'runSingle', onClick: () => run('single', node.id) },
        { label: '运行至所选组件', icon: 'runToCurrent', onClick: () => run('to-current', node.id) },
        { label: '运行所有', icon: 'runAll', onClick: () => run('all') },
        { divider: true },
        { label: '清除组件输出', onClick: () => clearOutputs('single', node) },
        { label: '清除所有组件输出', onClick: () => clearOutputs('all') },
        { divider: true },
        { label: '复制组件', icon: 'copy', onClick: () => copyCell(node) },
        { label: '删除组件', icon: 'delete', onClick: () => delCell(node) },
      ],
    )
  })

  /**
   * 整个fileContent会在初始化时传入，并且不会变更，只有vue应用会单向往widget传递最新的fileContnet
   * 需要补充在保存时去掉的一些冗余配置
   */
  graph.fromJSON({
    cells: props.fileContent.cells.map(c => {
      const cell = { ...c }
      if (cell.shape === 'cpw-cell-node') cell.ports = portConfig
      else if (cell.shape === 'cpw-edge') cell.attrs = { line: { strokeDasharray: '' } }
      return cell
    }),
  })

  // setOutgosMap('all')
})

// * ------------------- 节点操作 -------------------
const getCell = (target: Cell | string) => typeof target === 'string' ? graph.getCellById(target) : target
// const activeNodeId = ref('')
const activeCell = shallowRef<CPW.Cell | null>(null)

const setActive = (target: string | Cell | null) => {
  if (target) {
    const cell = getCell(target)
    if (cell?.shape !== 'cpw-cell-node') return
    if (activeCell.value && activeCell.value?.id !== cell.id) updateCellData(activeCell.value.id, { active: false }, false)
    if (activeCell.value?.id === cell.id) return
    updateCellData(cell, { active: true }, false)
    activeCell.value = { ...cell.getData() as CPW.Cell }

    // console.log(activeCell.value)
    console.log(wrapRunnerCode(activeCell.value))
  } else {
    if (!activeCell.value) return
    updateCellData(activeCell.value.id, { active: false })
    activeCell.value = null
  }
}

const updateCellData = (target: string | Cell, data: Partial<CPW.Cell>, save = true) => {
  const cell = getCell(target)
  if (!cell) return
  cell.setData(data, { deep: false, overwrite: false })
  if (activeCell.value?.id === cell.id) activeCell.value = { ...cell.getData() as CPW.Cell }
  if (save)fileChange()
}

const delCell = (target: string | Cell) => {
  if (activeCell.value && activeCell.value.id === (typeof target === 'string' ? target : target.id)) {
    // 如果要删除选中节点的话要先清空状态，否则有连线的时候，graph.removeCell之后会移除连线触发edge:removed，里面找activeCell会出错
    activeCell.value = null
  }
  const cell = graph.removeCell(target as any)
  cell?.dispose()
  return cell
  // 在这里不用处理cfg的incomes更新，因为如果是选中节点的父节点的话，则必会有连线，删除节点时会触发edge:removed走里面的cfg更新逻辑
}

const copyCell = (target: string | Cell) => {
  const cell = getCell(target)
  if (!cell || cell.shape !== 'cpw-cell-node') return
  graph.copy([cell])
  const [newCell] = graph.paste()
  // 只复制通用信息, 因为没有连线，income也要清除值
  const { incomes } = cell.getData<CPW.Cell>()
  updateCellData(newCell, { id: newCell.id, outputs: [], active: false, node: undefined, status: 'changed', incomes: incomes.map(o => ({ ...o, value: '' })) })
  graph.cleanClipboard()
}

const run = (type: CPW.RunType, id?: string) => {
  if (kernelStatus.value !== 'idle') return showErrorMessage('运行失败', '内核非空闲状态')

  let runnerCells: CPW.RunnerCell[] = []
  if (type === 'all') {
    // 分析所有
  } else if (type === 'to-current' && id) {
    // 分析所有至当前节点
    const node = getCell(id)
    runnerCells = getRunnerCellsToTarget(graph, node)
  } else if (type === 'single' && id) {
    // 运行当前节点
    const node = getCell(id)
    runnerCells = [{ id: node.id, level: 0, code: wrapRunnerCode(node.getData<CPW.Cell>()) }]
  }
  runnerCells.forEach(({ id }) => updateCellData(id, { status: 'waiting' }))
  dispatchAction(props.id, { type: 'run', data: { cells: runnerCells } })
}

const clearOutputs = (type: 'single' | 'all', target?: string | Cell) => {
  if (type === 'single' && target) {
    const cell = getCell(target)
    if (cell) updateCellData(cell, { outputs: [], node: undefined, status: 'changed' })
  } else {
    graph.getCells().forEach(node => {
      if (node.shape === 'cpw-cell-node') updateCellData(node, { outputs: [], node: undefined, status: 'changed' })
    })
  }
}

const fileChange = useThrottleFn(
  () => {
    const json = graph.toJSON()
    json.cells.forEach(cell => {
      // 删除冗余配置
      if (cell.shape === 'cpw-cell-node') {
        delete cell.data.node
        delete cell.ports
        cell.data.active = false
        // 不保存节点运行中的状态
        if (cell.data.status === 'running' || cell.data.status === 'waiting') cell.data.status = 'changed'
      } else if (cell.shape === 'cpw-edge') {
        delete cell.attrs
      }
    })
    dispatchAction(props.id, { type: 'change', data: { content: JSON.stringify(json) } })
  },
  150,
  true,
  false,
)

// * ---------------- toolbar --------------------
const toolbarLeft = computed<ToolbarBtn[]>(() => {
  const noActive = !activeCell.value
  return [
    dndCollapsed.value
      ? { title: '展开组件列表', icon: 'menuClose', onClick: () => { dndCollapsed.value = false } }
      : { title: '收起组件列表', icon: 'menuOpen', onClick: () => { dndCollapsed.value = true } },
    { title: '保存', icon: 'save', onClick: () => dispatchAction(props.id, { type: 'save', data: null }) },
    { title: '复制组件', icon: 'copy', disabled: noActive, onClick: () => copyCell(activeCell.value!.id) },
    { title: '运行组件', icon: 'runSingle', disabled: noActive, onClick: () => run('single', activeCell.value!.id) },
    { title: '运行至所选', icon: 'runToCurrent', disabled: noActive, onClick: () => run('to-current', activeCell.value!.id) },
    { title: '运行所有', icon: 'runAll', onClick: () => run('all') },
    { title: '中止内核', icon: 'stop', onClick: () => dispatchAction(props.id, { type: 'kernelInterrupt', data: null }) },
    { title: '重启内核', icon: 'restart', onClick: () => dispatchAction(props.id, { type: 'kernelResert', data: null }) },
  ]
})

const toolbarRight = computed<ToolbarBtn[]>(() => {
  const noActive = !activeCell.value
  return [
    cfgCollapsed.value
      ? { title: '展开组件配置', icon: 'menuOpen', disabled: noActive, onClick: () => { cfgCollapsed.value = false } }
      : { title: '收起组件配置', icon: 'menuClose', disabled: noActive, onClick: () => { cfgCollapsed.value = true } },
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

// * --------- dnd数据 --------------
const getCellCategories = async () => {
  // 多个cpw同时挂载时确保只请求一次
  if (window.__cpw_categories_loading.value) return
  window.__cpw_categories_loading.value = true
  try {
    const data = await reqCategories()
    window.__cpw_categories.value = data
  } catch (err: any) {
    MessagePlugin.error(err.message)
  }
  window.__cpw_categories_loading.value = false
}
if (!window.__cpw_categories.value.length) getCellCategories()

// * --------- cfg数据 --------------
const getPredecessors = (target: Cell | string) => {
  const cell = getCell(target)
  if (!cell) return []
  return graph.getPredecessors(cell)
}

</script>
