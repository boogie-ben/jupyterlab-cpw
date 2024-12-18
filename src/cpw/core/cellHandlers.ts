import type { Graph, Cell } from '@antv/x6'
import { cloneFnJSON } from '@vueuse/core'
import { paramValidator } from './Cfg/utils'

// * ------------- 组件输入、参数处理 --------------------
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
      ...(options && { options: cloneFnJSON(options) }),
    }
  })
}

export const formatCellIncomes = (configs: CPW.CellIncomeConfig[]): CPW.CellIncome[] => {
  return configs.map(o => ({ ...o, value: '' }))
}

export const formatCellOutgos = (configs: CPW.CellOutgoConfig[]): CPW.CellOutgo[] => {
  return configs.map(o => ({ ...o }))
}

// Python 3.11 中的关键字列表，可根据Python版本更新此列表
const pythonKeywords = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
]
const pyidReg = /^[a-zA-Z_][a-zA-Z0-9_]*$/
/** 判断是否为python的合法标识符 */
export const isLegalPythonIdentifier = (name: string) => {
  if (!name || !pyidReg.test(name)) return false
  return !pythonKeywords.includes(name)
}

// * ----------- 流水线运行解析 ----------
export const cellValidator = ({ id, params, incomes }: CPW.Cell) => {
  const pass = incomes.every(ic => ic.required ? ic.value : true) && params.every(pc => paramValidator(pc))
  if (!pass) window.dispatchEvent(new CustomEvent(`cpw-cell-error-${id}`, { detail: true }))
  return pass
}

const getIncomNode = (graph: Graph, node: Cell) => {
  return (graph.getIncomingEdges(node) || []).map(e => e.getSourceNode()!)
}

// todo，条件分支
export const getRunnerCellsToTarget = (graph: Graph, node: Cell): CPW.RunnerCell[] | null => {
  let hasErr = false
  const nodeData = node.getData<CPW.Cell>()

  if (!cellValidator(nodeData)) hasErr = true

  const runnerCells = [{ id: node.id, level: 0, code: wrapRunnerCode(nodeData) }]

  const deep = (currNode: Cell, currLevel: number) => {
    const incomNodes = getIncomNode(graph, currNode)
    incomNodes.forEach(pNode => {
      const data = pNode.getData<CPW.Cell>()
      if (!cellValidator(data)) hasErr = true
      runnerCells.push({ id: pNode.id, level: currLevel + 1, code: wrapRunnerCode(data) })
      deep(pNode, currLevel + 1)
    })
  }

  deep(node, 0)

  runnerCells.sort((a, b) => b.level - a.level)

  return hasErr ? null : runnerCells
}

const pid = (id: string) => id.replace(/-/g, '_')

/** 处理组件运行代码 */
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
    ? '    return { ' + outgos.map(({ name }) => `'${name}': ${name}`).join(', ') + ' }'
    : ''

  const excute = outgos.length
    ? `__cpw_${id}_res = __cpw_${id}_func(${incomeArgs})`
    : `__cpw_${id}_func(${incomeArgs})`

  const outgoRenders = outgos.map(({ name }) => `IPython.display.display(__cpw_${id}_res['${name}'])`).join('\n')

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
