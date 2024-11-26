import { ServiceManager } from '@jupyterlab/services'
import { IFileBrowserFactory } from '@jupyterlab/filebrowser'
import { CommandRegistry } from '@lumino/commands'
import { Widget } from '@lumino/widgets'
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget,
} from '@jupyterlab/docregistry'
// import * as nbformat from '@jupyterlab/nbformat'
// import { MathJaxTypesetter } from '@jupyterlab/mathjax-extension';
// import { createMarkdownParser } from '@jupyterlab/markedparser-extension';
import { OutputArea, OutputAreaModel } from '@jupyterlab/outputarea'

// import { SessionContext } from '@jupyterlab/apputils';
import {
  standardRendererFactories as initialFactories,
  RenderMimeRegistry,
} from '@jupyterlab/rendermime'

// eslint-disable-next-line
// @ts-ignore
import { renderCpw } from './core/index'

const rendermime = new RenderMimeRegistry({ initialFactories })

// const outputArea = new OutputArea({ model, rendermime });
// const CPW_RUNNING_DIR = 'cpw-running';
// const ren = (cells: any[]) => {
//   const warp = document.createElement('div')
//   warp.style.width = '100%'
//   warp.style.height = '100%'
//   warp.style.overflowY = 'auto'
//   cells.forEach(cell => {
//     const node = document.createElement('div')
//     node.style.backgroundColor = '#222'
//     node.style.marginBottom = '20px'
//     const source = document.createElement('div')
//     const output = document.createElement('div')
//     source.innerText = cell.source.join('')
//     output.innerText = JSON.stringify(cell.outputs)
//     output.setAttribute('id', cell.id)
//     node.appendChild(source)
//     node.appendChild(document.createElement('hr'))
//     node.appendChild(output)
//     warp.appendChild(node)
//   })
//   return warp
// }

class CPWWidget extends Widget {
  readonly div: HTMLDivElement
  private _commands: CommandRegistry
  private _serviceManager: ServiceManager.IManager
  private _browserFactory: IFileBrowserFactory
  private _context: DocumentRegistry.Context

  get sessionContext () {
    return this._context.sessionContext
  }

  constructor (options: {
    commands: CommandRegistry;
    serviceManager: ServiceManager.IManager;
    browserFactory: IFileBrowserFactory;
    context: DocumentRegistry.Context;
  }) {
    super()
    this._commands = options.commands
    this._serviceManager = options.serviceManager
    this._browserFactory = options.browserFactory
    this._context = options.context

    const div = document.createElement('div')
    const btn = document.createElement('button')
    btn.innerText = 'run'

    btn.onclick = () => {
      this.run()
    }

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
      // const { cells } = JSON.parse(this._context.model.toString())
      // this.div.appendChild(ren(cells))
      // this.node.appendChild(this.div)
      renderCpw(this.node, this._context.model.toString())
    })
  }

  async run () {
    if (this.sessionContext.session?.kernel?.status !== 'idle') {
      // todo 提醒dialog
      console.log('内核未准备', this.sessionContext.session)
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

  updateCellOutput (cellId: string, outputs: any[]) {
    const content = JSON.parse(this._context.model.toString())
    const cell = content.cells.find((cell: any) => cell.id === cellId)
    cell.outputs = outputs
    this._context.model.fromString(JSON.stringify(content))
    this.div.innerHTML = ''
    // this.div.appendChild(ren(content.cells))
    // this.div.querySelector('p')!.innerText = this._context.model.toString();
  }

  eventHandler () {
    console.log(this._context)
    console.log(this._commands)
    console.log(this._serviceManager)
    console.log(this._browserFactory)
    // console.log(this.sessionConnection);
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
  constructor (
    options: DocumentWidget.IOptions<CPWWidget, DocumentRegistry.IModel>,
  ) {
    super(options)
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace, no-unused-vars
namespace CPWFactory {
  export interface ICPWFactoryOptions
    extends DocumentRegistry.IWidgetFactoryOptions {
    commands: CommandRegistry;
    serviceManager: ServiceManager.IManager;
    browserFactory: IFileBrowserFactory;
  }
}

// eslint-disable-next-line no-redeclare
export class CPWFactory extends ABCWidgetFactory<
  CPWDocumentWidget,
  DocumentRegistry.IModel
> {
  constructor (options: CPWFactory.ICPWFactoryOptions) {
    super(options)
    this._commands = options.commands
    this._serviceManager = options.serviceManager
    this._browserFactory = options.browserFactory
  }

  protected createNewWidget (
    context: DocumentRegistry.Context,
  ): CPWDocumentWidget {
    return new CPWDocumentWidget({
      context,
      // commands: this._commands,
      content: new CPWWidget({
        commands: this._commands,
        serviceManager: this._serviceManager,
        browserFactory: this._browserFactory,
        context,
      }),
    })
  }

  private _commands: CommandRegistry
  private _serviceManager: ServiceManager.IManager
  private _browserFactory: IFileBrowserFactory
}
