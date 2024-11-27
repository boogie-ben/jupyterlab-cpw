declare module '*.svg' {
  const value: string
  export default value
}

declare namespace CPW {
  export interface Cell {
    id: string

    /** 节点源代码 */
    source: string

    /** 输出 */
    outputs: import('@jupyterlab/nbformat').IOutput[]
    /** 修改了节点代码内容或参数，但未重新执行 */
    changed: boolean
    /** 运行中 */
    running: boolean
    /** 运行结果错误 */
    err: boolean
    /** 运行结果正常 */
    done: boolean
  }

  export interface RunnerCell {
    id: string
    /** 运行workflow时，把source处理后交由内核实际运行的代码 */
    code: string
  }

  // *------- 从vue应用内调用的action ------------
  export type ActionType = 'run' | 'kernelResert' | 'kernelInterrupt' | 'exportIpynb' | 'change' | 'kernelStatus'

  export interface ActionPayloadData {
    run: { cells: RunnerCell[] }
    kernelResert: null
    kernelInterrupt: null
    exportIpynb: null
    change: { graph: any }
    kernelStatus: null
  }

  // export type ActionPayload<T extends ActionType> = { type: T } & (ActionPayloadData[T] extends null ? { data?: any } : { data: ActionPayloadData[T] })
  export interface ActionPayload<T extends ActionType> {
    type: T
    data: ActionPayloadData[T]
  }

  export interface DispatchAction {
    (id: string, payload: ActionPayload<'run'>): any
    (id: string, payload: ActionPayload<'kernelResert'>): any
    (id: string, payload: ActionPayload<'kernelInterrupt'>): any
    (id: string, payload: ActionPayload<'exportIpynb'>): any
    (id: string, payload: ActionPayload<'change'>): any
    (id: string, payload: ActionPayload<'kernelStatus'>): any
  }

  // *------- 从jupyter插件widget往vue应用派发的事件 ------------
  export type EventType = 'updateCell' | 'kernelStatus'

  export interface EventPayloadData {
    updateCell: { id: string, outputs: Cell['outputs'] }
    kernelStatus: { status: import('@jupyterlab/services').Kernel.Status }
  }

  export interface EventPayload<T extends EventType> {
    type: T
    data: EventPayloadData[T]
  }

  export interface DispatchEvent {
    (id: string, payload: EventPayload<'updateCell'>): any
    (id: string, payload: EventPayload<'kernelStatus'>): any
  }
}
