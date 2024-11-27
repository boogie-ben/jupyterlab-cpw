import { CommandRegistry } from '@lumino/commands'
import { Widget } from '@lumino/widgets'
import { DocumentRegistry, ABCWidgetFactory, DocumentWidget } from '@jupyterlab/docregistry'
import { OutputArea, OutputAreaModel } from '@jupyterlab/outputarea'

import { standardRendererFactories, RenderMimeRegistry } from '@jupyterlab/rendermime'
// import * as nbformat from '@jupyterlab/nbformat'
import { renderCPW } from './core/index'

const rendermime = new RenderMimeRegistry({ initialFactories: standardRendererFactories })

const dispatchEvent: CPW.DispatchEvent = (id, payload) => {
  window.dispatchEvent(new CustomEvent(`cpw-event-${id}`, { detail: payload }))
}

class CPWWidget extends Widget {
  private _commands: CommandRegistry
  private _context: DocumentRegistry.Context

  get session () {
    return this._context.sessionContext.session
  }

  constructor (options: { commands: CommandRegistry, context: DocumentRegistry.Context }) {
    super()
    this._commands = options.commands
    this._context = options.context

    this._context.ready.then(() => {
      const content = this._context.model.toString()
      if (!content) {
        this._context.model.fromString(JSON.stringify({ graph: { cells: [] } })) // 画布对象
        this._commands.execute('docmanager:save')
      }
      console.log(this)
      window.addEventListener(`cpw-action-${this.id}`, this)
      renderCPW(this.node, this.id, this._context.model.toString())
    })
  }

  handleEvent (e: CustomEvent<CPW.ActionPayload<CPW.ActionType>>) {
    this[e.detail.type]?.(e.detail.data as any)
  }

  async run (payload: CPW.ActionPayloadData['run']) {
    if (this.session?.kernel?.status !== 'idle') {
      // todo 提醒dialog
      console.log('内核未准备', this._context.sessionContext)
      return
    }
    // todo 分支并行执行逻辑
    const { cells } = payload
    const len = cells.length
    for (let i = 0; i < len; i++) {
      // todo 中断内核时打断循环
      const { id, code } = cells[i]
      const outputArea = new OutputArea({ model: new OutputAreaModel(), rendermime })
      outputArea.future = this.session.kernel.requestExecute({ code })
      await outputArea.future.done
      const outputNode = document.getElementById(id)!
      outputNode.textContent = ''
      outputNode.appendChild(outputArea.node)
    }

    console.log('done')
  }

  kernelResert () {
    this.session?.kernel?.restart()
  }

  kernelInterrupt () {
    // todo 打断正在执行的run循环
    this.session?.kernel?.interrupt()
  }

  kernelStatus () {
    dispatchEvent(this.id, { type: 'kernelStatus', data: { status: this.session?.kernel?.status || 'unknown' } })
  }

  exportIpynb () {
    // todo 流水线导出为notebook
  }

  change (payload: CPW.ActionPayloadData['change']) {
    const { graph } = payload
    this._context.model.fromString(graph)
  }

  dispose () {
    window.removeEventListener(`cpw-action-${this.id}`, this, false)
    super.dispose()
  }
}

export class CPWDocumentWidget extends DocumentWidget<CPWWidget> {
  // eslint-disable-next-line no-useless-constructor
  constructor (options: DocumentWidget.IOptions<CPWWidget, DocumentRegistry.IModel>) {
    super(options)
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace, no-unused-vars
namespace CPWFactory {
  export interface ICPWFactoryOptions
    extends DocumentRegistry.IWidgetFactoryOptions {
    commands: CommandRegistry;
  }
}

// eslint-disable-next-line no-redeclare
export class CPWFactory extends ABCWidgetFactory<CPWDocumentWidget, DocumentRegistry.IModel> {
  constructor (options: CPWFactory.ICPWFactoryOptions) {
    super(options)
    this._commands = options.commands
  }

  protected createNewWidget (context: DocumentRegistry.Context): CPWDocumentWidget {
    return new CPWDocumentWidget({
      context,
      content: new CPWWidget({ commands: this._commands, context }),
    })
  }

  private _commands: CommandRegistry
}
