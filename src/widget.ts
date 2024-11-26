import { CommandRegistry } from '@lumino/commands'
import { Widget } from '@lumino/widgets'
import { DocumentRegistry, ABCWidgetFactory, DocumentWidget } from '@jupyterlab/docregistry'
import { OutputArea, OutputAreaModel } from '@jupyterlab/outputarea'

import { standardRendererFactories, RenderMimeRegistry } from '@jupyterlab/rendermime'

import { renderCpw } from './core/index'

const rendermime = new RenderMimeRegistry({ initialFactories: standardRendererFactories })

class CPWWidget extends Widget {
  readonly div: HTMLDivElement
  private _commands: CommandRegistry
  private _context: DocumentRegistry.Context

  get sessionContext () {
    return this._context.sessionContext
  }

  constructor (options: { commands: CommandRegistry, context: DocumentRegistry.Context }) {
    super()
    this._commands = options.commands
    this._context = options.context

    const div = document.createElement('div')
    const btn = document.createElement('button')
    btn.innerText = 'run'

    btn.onclick = () => this.run()

    this.div = div
    this.node.appendChild(btn)
    this.node.style.overflow = 'auto'

    this._context.ready.then(async () => {
      const content = this._context.model.toString()
      if (!content) {
        this._context.model.fromString(JSON.stringify({ cells: [] })) // 画布对象
        this._commands.execute('docmanager:save')
      }
      console.log(this)
      this.node.appendChild(this.div)
      renderCpw(this.div, this._context.model.toString())
    })
  }

  async run () {
    if (this.sessionContext.session?.kernel?.status !== 'idle') {
      // todo 提醒dialog
      console.log('内核未准备', this.sessionContext)
      return
    }

    // todo更改为参数传入
    const content = JSON.parse(this._context.model.toString())

    const len = content.cells.length
    for (let i = 0; i < len; i++) {
      // todo 中断内核时打断循环
      const { id, source } = content.cells[i]

      const outputArea = new OutputArea({
        model: new OutputAreaModel(),
        rendermime,
      })

      outputArea.future = this.sessionContext.session.kernel.requestExecute({
        code: source.join('\n'),
      })

      await outputArea.future.done
      const outputNode = document.getElementById(id)!
      outputNode.textContent = ''
      outputNode.appendChild(outputArea.node)
    }

    console.log('done')
  }

  // kernelResert() {
  //   this.kernel?.restart();
  // }

  // kernelInterrupt() {
  //   this.kernel?.interrupt();
  // }

  // dispose() {
  //   // this.sessionContext
  //   // this.sessionContext.dispose();
  //   // this.kernel?.dispose();
  //   // this.kernelManager.dispose();
  //   super.dispose();
  // }
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
