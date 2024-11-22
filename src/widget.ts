import { ServiceManager } from '@jupyterlab/services';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { CommandRegistry } from '@lumino/commands';
import { Widget } from '@lumino/widgets';
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget
} from '@jupyterlab/docregistry';

import {
  KernelManager
  // Session,
  // SessionAPI,
  // ContentsManager,
  // SessionManager
} from '@jupyterlab/services';

const ipynbJSONTpl = {
  cells: [],
  metadata: {},
  nbformat: 4,
  nbformat_minor: 5
};

// const CPW_RUNNING_DIR = 'cpw-running';

class CPWWidget extends Widget {
  readonly div: HTMLDivElement;
  private _commands: CommandRegistry;
  private _serviceManager: ServiceManager.IManager;
  private _browserFactory: IFileBrowserFactory;
  private _context: DocumentRegistry.Context;

  constructor(options: {
    commands: CommandRegistry;
    serviceManager: ServiceManager.IManager;
    browserFactory: IFileBrowserFactory;
    context: DocumentRegistry.Context;
  }) {
    super();
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

    div.appendChild(btn);
    this.div = div;
    this.node.appendChild(this.div);

    this._context.ready.then(() => {
      const content = this._context.model.toString();
      if (!content) {
        this._context.model.fromString(JSON.stringify(ipynbJSONTpl));
        this._commands.execute('docmanager:save');
      }
      console.log(this);
      const p = document.createElement('p');
      p.innerText = this._context.model.toString();
      this.div.appendChild(p);
    });
  }

  async run() {
    let content: Record<string, any> = {};
    try {
      content = JSON.parse(this._context.model.toString());
    } catch {
      ('');
    }
    if (!content) {
      window.alert('ipynb错误');
      return;
    }

    const kernelManager = new KernelManager();
    const kernel = await kernelManager.startNew({ name: 'python' });

    const len = content.cells.length;
    for (let i = 0; i < len; i++) {
      const { id, source } = content.cells[i];
      const future = kernel.requestExecute({ code: source.join('\n') });
      let outputs = '';
      let count: null | number = null;
      future.onIOPub = msg => {
        console.log(id, msg);
        const content = msg.content as any;
        switch (msg.header.msg_type) {
          case 'execute_input':
            count = content.execution_count;
            break;
          case 'stream':
            outputs = content.text;
        }
      };
      await future.done;
      this.updateCellOutput(id, outputs, count);
      future.dispose();
    }

    console.log('done');

    kernel.dispose();
    kernelManager.dispose();
  }

  updateCellOutput(cellId: string, outputs: string, count: number | null) {
    const content = JSON.parse(this._context.model.toString());
    const cell = content.cells.find((cell: any) => cell.id === cellId);
    cell.outputs = outputs.split('\n').filter(Boolean);
    cell.execution_count = count || null;
    this._context.model.fromString(JSON.stringify(content));
    this.div.querySelector('p')!.innerText = this._context.model.toString();
  }

  eventHandler() {
    console.log(this._context);
    console.log(this._commands);
    console.log(this._serviceManager);
    console.log(this._browserFactory);
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
