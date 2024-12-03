declare namespace CPW {

  /** .cpw文件的JSON模型 */
  export interface FileSchema {
    cells: import('@antv/x6').Cell.Properties[]
  }

  export interface Cell {
    /** 节点id，由graph自动生成 */
    id: string

    /** 节点名称 */
    name: string

    /** 节点类型，也就是左侧组件dnd里源组件key */
    key: string

    /** 节点源代码 */
    source: string

    /** 输出 */
    outputs: import('@jupyterlab/nbformat').IOutput[]

    /**
     * - running 运行中
     * - error 运行结果错误
     * - done 成功，运行结果正常
     * - changed 修改了节点代码内容或参数，但未重新执行
     * - waiting 在本次运行的workflow线中，正在等待执行
     */
    status: 'running' | 'error' | 'done' | 'changed' | 'waiting'

    /** 当前节点是否被选中，整个workflow仅有一个cell会active */
    active: boolean

    /** 保存运行后的outputArea渲染节点 */
    node?: HTMLElement
  }

  export interface RunnerCell {
    readonly id: string
    /** 运行workflow时，把source处理后交由内核实际运行的代码 */
    readonly code: string
  }

  // *------- 从vue应用内调用的action ------------
  export type ActionType = 'run' | 'kernelResert' | 'kernelInterrupt' | 'exportIpynb' | 'change' | 'kernelStatus' | 'save'

  export interface ActionPayloadData {
    run: { cells: RunnerCell[] }
    kernelResert: null
    kernelInterrupt: null
    exportIpynb: null
    change: { content: string }
    kernelStatus: null
    save: null
  }

  // export type ActionPayload<T extends ActionType> = { type: T } & (ActionPayloadData[T] extends null ? { data?: any } : { data: ActionPayloadData[T] })
  export interface ActionPayload<T extends ActionType> {
    type: T
    data: ActionPayloadData[T]
  }

  /** 从vue应用内向jupyter插件widget发起的操作事件 */
  export interface DispatchAction {
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
  }

  // *------- 从jupyter插件widget往vue应用派发的事件 ------------
  export type EventType = 'cellOutputs' | 'cellStatus' | 'kernelStatus' | 'dispose'

  export interface EventPayloadData {
    cellOutputs: { id: string, outputs: Cell['outputs'], node: HTMLElement }
    cellStatus: { id: string, status: Cell['status'] }
    kernelStatus: { status: import('@jupyterlab/services').Kernel.Status }
    dispose: null
  }

  export interface EventPayload<T extends EventType> {
    type: T
    data: EventPayloadData[T]
  }

  /** 从jupyter插件widget往vue应用派发事件 */
  export interface DispatchEvent {
    /** 对指定id的cell派发执行后输出的outputs数组 */
    (id: string, payload: EventPayload<'cellOutputs'>): any
    /** 对指定id的cell派发节点状态 */
    (id: string, payload: EventPayload<'cellStatus'>): any
    /** 派发当前内核状态 */
    (id: string, payload: EventPayload<'kernelStatus'>): any
    /** widget在dispose时派发 */
    (id: string, payload: EventPayload<'dispose'>): any
  }

  // * -------------------
  /**
   * 运行类型
   * - all 运行所有
   * - to-current 运行至所选节点
   * - single 运行单个节点
   */
  export type RunType = 'all' | 'to-current' | 'single'
}
