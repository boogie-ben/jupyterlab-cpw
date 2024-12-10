import type { Graph, Cell } from '@antv/x6'
import type { Kernel } from '@jupyterlab/services'
import {
  mdiContentSave,
  mdiPlay,
  mdiSkipNext,
  mdiPlayCircle,
  mdiContentCopy,
  mdiStop,
  mdiRefresh,
  mdiTrashCan,
  mdiMemory,
  mdiMenuOpen,
  mdiMenuClose,
  mdiChevronRight,
  mdiHelpCircleOutline,
  mdiClose,
} from '@mdi/js'

export const dispatchAction: CPW.DispatchAction = (id, payload) => {
  window.dispatchEvent(new CustomEvent(`cpw-action-${id}`, { detail: payload }))
}

// todo 内核名称、点击切换内核
export const kernelStatusLabel: Record<Kernel.Status, string> = {
  autorestarting: '重启中...',
  busy: '繁忙',
  dead: '已关闭',
  idle: '空闲',
  restarting: '重启中...',
  starting: '启动中...',
  terminating: '关闭中...',
  unknown: '未知',
}

const mdiSvg = (path: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="${path}" /></svg>`

export const btnIcons = {
  save: mdiSvg(mdiContentSave),
  runSingle: mdiSvg(mdiPlay),
  runToCurrent: mdiSvg(mdiSkipNext),
  runAll: mdiSvg(mdiPlayCircle),
  copy: mdiSvg(mdiContentCopy),
  stop: mdiSvg(mdiStop),
  restart: mdiSvg(mdiRefresh),
  kernel: mdiSvg(mdiMemory),
  delete: mdiSvg(mdiTrashCan),
  menuOpen: mdiSvg(mdiMenuOpen),
  menuClose: mdiSvg(mdiMenuClose),
  chevronRight: mdiSvg(mdiChevronRight),
  help: mdiSvg(mdiHelpCircleOutline),
  close: mdiSvg(mdiClose),
}

export type BtnIcon = keyof typeof btnIcons

export type ToolbarBtn = {
  title: string
  icon: BtnIcon
  disabled?: boolean
  onClick:(e: MouseEvent) => any
}

// * ------------- 组件输入、参数处理 --------------------
export const formatCellIncomes = (configs: CPW.CellIncomeConfig[]): CPW.CellIncome[] => {
  return configs.map(o => ({ ...o, value: '' }))
}

export const formatCellParams = (configs: CPW.CellParamConfig[]): CPW.CellParam[] => {
  return configs.map((cfg) => {
    const { type, name, desc, required, options, default: _default } = cfg

    let value = _default
    if (type === 'bool') value = !!value

    return {
      type,
      name,
      desc,
      required,
      value,
      default: _default,
      ...(options ? { options } : {}),
    }
  })
}

// * ----------- 流水线运行解析 ----------
const getIncomNode = (graph: Graph, node: Cell) => {
  return (graph.getIncomingEdges(node) || []).map(e => e.getSourceNode()!)
}

// todo，条件分支
export const getRunnerCellsToTarget = (graph: Graph, node: Cell): CPW.RunnerCell[] => {
  const nodeData = node.getData<CPW.Cell>()

  const runnerCells = [{ id: node.id, level: 0, code: wrapRunnerCode(nodeData) }]

  const deep = (currNode: Cell, currLevel: number) => {
    const incomNodes = getIncomNode(graph, currNode)
    incomNodes.forEach(pNode => {
      const data = pNode.getData<CPW.Cell>()
      runnerCells.push({ id: pNode.id, level: currLevel + 1, code: wrapRunnerCode(data) })
      deep(pNode, currLevel + 1)
    })
  }

  deep(node, 0)

  runnerCells.sort((a, b) => b.level - a.level)

  return runnerCells
}

const pid = (id: string) => id.replace(/-/g, '_')

export const wrapRunnerCode = (cpwCell: CPW.Cell) => {
  const { id: _id, incomes, outgos, params, source/* , name */ } = cpwCell

  const id = pid(_id)

  // 包在函数里，要加一级缩进
  const sourceCode = source.split('\n').map(str => '    ' + str).join('\n')

  const incomeParams = incomes.map(({ name }) => name).join(', ')

  let incomeArgs = incomes
    .map(o => {
      if (!o.value) return 'None' // 输入值没有选择则传入None
      const [fromId, fromName] = o.value.split('|')
      return `__cpw_${pid(fromId)}_res['${fromName}']`
    })
    .join(',\n    ') // 避免单行代码过长，传参使用换行

  if (incomeArgs) incomeArgs = '\n    ' + incomeArgs + '\n'

  const outgoReturns = outgos.length
    ? '    return { ' + outgos.map(name => `'${name}': ${name}`).join(', ') + ' }'
    : ''

  const excute = outgos.length
    ? `__cpw_${id}_res = __cpw_${id}_func(${incomeArgs})`
    : `__cpw_${id}_func(${incomeArgs})`

  const outgoRenders = outgos.map(name => `IPython.display.display(__cpw_${id}_res['${name}'])`).join('\n')

  const paramDeclares = params.map(param => {
    let v = 'None'

    switch (param.type) {
    case 'bool':
      // bool类型不会留空
      v = param.value ? 'True' : 'False'
      break
    case 'opt':
    case 'str':
      if (!param.value) v = 'None' // 留空时为None
      else v = `'${param.value}'` // 字符串和选项类型自动包裹引号，无需像和鲸一样得用户给参数值包裹引号
      break
    case 'num':
      if (typeof param.value !== 'number' || Number.isNaN(param.value)) v = 'None' // 非法值、留空时为None
      else v = param.value + ''
    }
    return `    ${param.name} = ${v}`
  }).join('\n')

  const code =
`def __cpw_${id}_func(${incomeParams}):
${paramDeclares}
${sourceCode}
${outgoReturns}
${excute}
${outgoRenders}`
// '组件 ${name} 执行完毕'` // 最后一行暂时不要，因为发现excute_count区分不了组件

  return code
}
