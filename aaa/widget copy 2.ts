import { ServiceManager } from '@jupyterlab/services';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { CommandRegistry } from '@lumino/commands';
import { Widget } from '@lumino/widgets';
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget
} from '@jupyterlab/docregistry';
import * as nbformat from '@jupyterlab/nbformat';
// import { MathJaxTypesetter } from '@jupyterlab/mathjax-extension';
// import { createMarkdownParser } from '@jupyterlab/markedparser-extension';

import {
  KernelManager,
  Kernel
  // Session,
  // SessionAPI,
  // ContentsManager,
  // SessionManager
} from '@jupyterlab/services';

import {
  standardRendererFactories as initialFactories,
  RenderMimeRegistry
} from '@jupyterlab/rendermime';

// const CPW_RUNNING_DIR = 'cpw-running';
const ren = (cells: any[]) => {
  const warp = document.createElement('div');
  warp.setAttribute('id', 'cpw-warp');
  cells.forEach(cell => {
    const node = document.createElement('div');
    node.style.backgroundColor = '#222';
    node.style.marginBottom = '20px';
    const source = document.createElement('div');
    const output = document.createElement('div');
    source.innerText = cell.source.join('');
    output.innerText = JSON.stringify(cell.outputs);
    node.appendChild(source);
    node.appendChild(document.createElement('hr'));
    node.appendChild(output);
    warp.appendChild(node);
  });
  return warp;
};

class CPWWidget extends Widget {
  readonly div: HTMLDivElement;
  private _commands: CommandRegistry;
  private _serviceManager: ServiceManager.IManager;
  private _browserFactory: IFileBrowserFactory;
  private _context: DocumentRegistry.Context;
  private kernelManager = new KernelManager();
  private kernel: Kernel.IKernelConnection | undefined;
  private rendermine = new RenderMimeRegistry({ initialFactories });
  // private grahp: { cells: any[] };

  // get cells() {
  //   return this.grahp.cells.filter(cell => cell.shape === 'cpw-shape');
  // }

  constructor(options: {
    commands: CommandRegistry;
    serviceManager: ServiceManager.IManager;
    browserFactory: IFileBrowserFactory;
    context: DocumentRegistry.Context;
  }) {
    super();
    this.kernelManager.startNew({ name: 'python' }).then(kernel => {
      this.kernel = kernel;
    });
    this._commands = options.commands;
    this._serviceManager = options.serviceManager;
    this._browserFactory = options.browserFactory;
    this._context = options.context;

    const div = document.createElement('div');
    const btn = document.createElement('button');
    btn.innerText = 'run';

    btn.onclick = () => {
      this.run();
    };

    this.div = div;
    this.node.appendChild(btn);

    this._context.ready.then(() => {
      const content = this._context.model.toString();
      if (!content) {
        this._context.model.fromString(JSON.stringify({ cells: [] })); // 画布对象
        this._commands.execute('docmanager:save');
      }
      console.log(this);
      // const p = document.createElement('p');
      // p.innerText = this._context.model.toString();
      const { cells } = JSON.parse(this._context.model.toString());
      this.div.appendChild(ren(cells));
      this.node.appendChild(this.div);
    });
  }

  async run() {
    if (this.kernel?.status !== 'idle') {
      return;
    }
    // let content: Record<string, any> = {};
    // try {
    //   content = JSON.parse(this._context.model.toString());
    // } catch {
    //   ('');
    // }
    // if (!content) {
    //   window.alert('ipynb错误');
    //   return;
    // }

    // todo更改为参数传入
    const content = JSON.parse(this._context.model.toString());

    const len = content.cells.length;
    for (let i = 0; i < len; i++) {
      // todo 中断内核时打断循环
      const { id, source } = content.cells[i];
      const future = this.kernel.requestExecute({ code: source.join('\n') });

      const outputs: nbformat.IOutput[] = [];

      future.onIOPub = msg => {
        console.log(id, msg);
        const msgType = msg.header.msg_type;
        switch (msg.header.msg_type) {
          // todo 消息类型update_display_data
          case 'execute_result':
          case 'display_data':
          case 'stream':
          case 'error':
            outputs.push({ ...msg.content, output_type: msgType });
            break;
        }
      };

      await future.done;
      this.updateCellOutput(id, outputs);
      future.dispose();
    }

    console.log('done');
  }

  updateCellOutput(cellId: string, outputs: nbformat.IOutput[]) {
    const content = JSON.parse(this._context.model.toString());
    const cell = content.cells.find((cell: any) => cell.id === cellId);
    cell.outputs = outputs;
    this._context.model.fromString(JSON.stringify(content));
    this.div.innerHTML = '';
    this.div.appendChild(ren(content.cells));
    // this.div.querySelector('p')!.innerText = this._context.model.toString();
  }

  eventHandler() {
    console.log(this._context);
    console.log(this._commands);
    console.log(this._serviceManager);
    console.log(this._browserFactory);
  }

  kernelResert() {
    this.kernel?.restart();
  }

  kernelInterrupt() {
    this.kernel?.interrupt();
  }

  dispose() {
    this.kernel?.dispose();
    this.kernelManager.dispose();
    super.dispose();
  }
}

export class CPWDocumentWidget extends DocumentWidget<CPWWidget> {
  constructor(
    options: DocumentWidget.IOptions<CPWWidget, DocumentRegistry.IModel>
  ) {
    super(options);
  }
}

namespace CPWFactory {
  export interface ICPWFactoryOptions
    extends DocumentRegistry.IWidgetFactoryOptions {
    commands: CommandRegistry;
    serviceManager: ServiceManager.IManager;
    browserFactory: IFileBrowserFactory;
  }
}

export class CPWFactory extends ABCWidgetFactory<
  CPWDocumentWidget,
  DocumentRegistry.IModel
> {
  constructor(options: CPWFactory.ICPWFactoryOptions) {
    super(options);
    this._commands = options.commands;
    this._serviceManager = options.serviceManager;
    this._browserFactory = options.browserFactory;
  }

  protected createNewWidget(
    context: DocumentRegistry.Context
  ): CPWDocumentWidget {
    return new CPWDocumentWidget({
      context,
      // commands: this._commands,
      content: new CPWWidget({
        commands: this._commands,
        serviceManager: this._serviceManager,
        browserFactory: this._browserFactory,
        context
      })
    });
  }

  private _commands: CommandRegistry;
  private _serviceManager: ServiceManager.IManager;
  private _browserFactory: IFileBrowserFactory;
}
