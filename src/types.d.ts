declare namespace CPW {

  /** .cpw文件的JSON模型 */
  interface FileSchema {
    cells: import('@antv/x6').Cell.Properties[]
  }

  /** 组件参数 */
  interface CellParam {
    /** 参数类型 */
    type: 'str' | 'num' | 'bool' | 'opt'
    /**
     * 参数值，在画布上创建组件时填充，创建后可修改组件参数值
     * 如果有默认值将填充默认值
     * 如果参数可留空，则空时的值为undefined（和td表单组件的选择器、数值输入清空状态一样）
     */
    value: string | number | boolean | null
    /**
     * 参数默认值
     * str、num、opt类型非必选时，若无值，py运行时则会是None，不会是空字符串（跟和鲸一样）
     * bool类型固定必须，只有true或false
     */
    default: string | number | boolean | null
    /**
     * 是否必选
     * bool类型固定必选，会忽略本字段逻辑
     */
    required: boolean
    /** 参数的变量名 */
    name: string
    /** 参数描述 */
    desc: string
    /** option类型时必须要有options字段 */
    options?: { label: string, value: string }[]
  }

  /** 组件参数配置 */
  type CellParamConfig = Omit<CellParam, 'value'>

  /** 组件输入配置 */
  interface CellIncomeConfig {
    /** 输入值在本组件内使用的变量名 */
    name: string
    /** 是否必选 */
    required: boolean
    /** 输入描述 */
    desc: string
  }

  /** 组件输入 */
  interface CellIncome extends CellIncomeConfig {
    /**
     * 用字符串值表示输入
     * 格式为 目标前序节点id|目标前序节点输出变量名
     * fromID|fromName
     */
    value: string
    // /** 目标前序节点id */
    // fromId: string
    // /** 目标前序节点的输出变量名 */
    // fromName: string
    // /** 输入描述 */
    // desc: string
    // /** 输入值在本组件内使用的变量名 */
    // name: string
  }

  /** 组件输出配置 */
  interface CellOutgoConfig {
    /** 组件输出变量名 */
    name: string
    /** 描述 */
    desc: string
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface CellOutgo extends CellOutgoConfig {}

  interface CellCommon {
    /** 组件名称 */
    name: string

    /** 组件类型，也就是左侧组件dnd里源组件key */
    key: string

    /** 组件描述说明 */
    desc: string

    /** 节点源代码 */
    source: string
  }

  interface Cell extends CellCommon {
    /** 组件内部id，由graph自动生成的id保持一致 */
    id: string

    /** 输出 */
    outputs: import('@jupyterlab/nbformat').IOutput[]

    /**
     * - running 运行中
     * - error 运行结果错误
     * - done 成功，运行结果正常
     * - changed 修改了组件代码内容或参数，但未重新执行
     * - waiting 在本次运行的workflow线中，正在等待执行
     */
    status: 'running' | 'error' | 'done' | 'changed' | 'waiting'

    /** 当前组件是否被选中，整个workflow仅有一个cell会active */
    active: boolean

    /** 保存运行后的outputArea渲染节点 */
    node?: HTMLElement

    /** 组件参数 */
    params: CellParam[]

    /** 组件输入 */
    incomes: CellIncome[]

    /** 组件输出 */
    outgos: CellOutgo[]
  }

  interface RunnerCell {
    /** 和Cell的id一致 */
    readonly id: string
    /** 运行workflow时，把source处理后交由内核实际运行的代码，也是导出ipynb的实际代码 */
    readonly code: string
    /** 本次运行时组件的层级 */
    readonly level: number
  }

  /**
   * 运行类型
   * - all 运行所有
   * - to-current 运行至所选节点
   * - single 运行单个节点
   */
  type RunType = 'all' | 'to-current' | 'single'

  // *------- 从vue应用内调用的action ------------
  type ActionType = 'run' | 'kernelResert' | 'kernelInterrupt' | 'exportIpynb' | 'change' | 'kernelStatus' | 'save' | 'renderOutputs'

  interface ActionPayloadData {
    run: { cells: RunnerCell[] }
    kernelResert: null
    kernelInterrupt: null
    exportIpynb: null
    change: { content: string }
    kernelStatus: null
    save: null
    renderOutputs: { id: string, outputs: Cell['outputs'] }
  }

  // type ActionPayload<T extends ActionType> = { type: T } & (ActionPayloadData[T] extends null ? { data?: any } : { data: ActionPayloadData[T] })
  interface ActionPayload<T extends ActionType> {
    type: T
    data: ActionPayloadData[T]
  }

  /** 从vue应用内向jupyter插件widget发起的操作事件 */
  interface DispatchAction {
    /** 运行指定workflow */
    (id: string, payload: ActionPayload<'run'>): any
    /** 重启内核 */
    (id: string, payload: ActionPayload<'kernelResert'>): any
    /** 中断内核 */
    (id: string, payload: ActionPayload<'kernelInterrupt'>): any
    /** 请求内核状态，widget会派发kernelStatus事件 */
    (id: string, payload: ActionPayload<'kernelStatus'>): any
    /** 导出为ipynb文件（notebook） */
    (id: string, payload: ActionPayload<'exportIpynb'>): any
    /** 内容更改，传输最新的fileContent给widget保存到context.model中 */
    (id: string, payload: ActionPayload<'change'>): any
    /** 保存文件 */
    (id: string, payload: ActionPayload<'save'>): any
    /** 传入一个outputs数组，widget会派发cellOutputs事件。用于打开cpw文件后回显某个节点的输出渲染 */
    (id: string, payload: ActionPayload<'renderOutputs'>): any
  }

  // *------- 从jupyter插件widget往vue应用派发的事件 ------------
  type EventType = 'cellOutputs' | 'cellStatus' | 'kernelStatus' | 'dispose'

  interface EventPayloadData {
    cellOutputs: { id: string, outputs: Cell['outputs'], node: HTMLElement }
    cellStatus: { id: string, status: Cell['status'] }
    kernelStatus: { status: import('@jupyterlab/services').Kernel.Status }
    dispose: null
  }

  interface EventPayload<T extends EventType> {
    type: T
    data: EventPayloadData[T]
  }

  /** 从jupyter插件widget往vue应用派发事件 */
  interface DispatchEvent {
    /** 对指定id的cell派发执行后输出的outputs数组 */
    (id: string, payload: EventPayload<'cellOutputs'>): any
    /** 对指定id的cell派发节点状态 */
    (id: string, payload: EventPayload<'cellStatus'>): any
    /** 派发当前内核状态 */
    (id: string, payload: EventPayload<'kernelStatus'>): any
    /** widget在dispose时派发 */
    (id: string, payload: EventPayload<'dispose'>): any
  }
}
