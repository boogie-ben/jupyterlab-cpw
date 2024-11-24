import { ServiceManager } from '@jupyterlab/services';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { CommandRegistry } from '@lumino/commands';
import { Widget } from '@lumino/widgets';
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget
} from '@jupyterlab/docregistry';

const ipynbJSONTpl = {
  cells: [],
  metadata: {},
  nbformat: 4,
  nbformat_minor: 5
};

class CPWWidget extends Widget {
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

    // const content = this._context.model.toString() || '';

    // div.innerText = content;

    this.div = div;
    this.node.appendChild(this.div);

    this._context.ready.then(() => {
      const content = this._context.model.toString();
      if (!content) {
        this._context.model.fromString(JSON.stringify(ipynbJSONTpl));
        this._commands.execute('docmanager:save');
      }
      const p = document.createElement('p');
      p.innerText = this._context.model.toString();
      this.div.appendChild(p);
    });

    // this._context.ready.then(() => {
    //   const content = this._context.model.toString() || '';
    //   this.div.innerText = content;
    //   this._commands.execute('notebook:run-all-cells');
    // });
    // console.log(this._context.model);
    // this.filePath = this._context.localPath;

    // // 移动文件目录、改文件名
    // this._context.pathChanged.connect(() => {
    //   this.filePath = this._context.localPath;
    // }, this);

    // window.addEventListener('message', this)

    // setTimeout(() => {
    //   this._context.model.fromString('sdfgfvgver');
    // }, 3000);
  }

  run() {
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

    const cells = content.cells.map((cell: any) => {
      const { cell_type, execution_count, id, metadata, source } = cell;
      // {
      //   cell_type: 'code',
      //   execution_count: null,
      //   id: '74fb2c5a-90eb-4726-8753-90a85f32537e',
      //   metadata: {},
      //   outputs: [],
      //   source: ['import time\n', 'time.sleep(5)']
      // }
      return {
        cell_type,
        execution_count,
        id,
        metadata,
        outputs: [],
        source,
        cpw_id: id
      };
    });

    this._commands
      .execute('notebook:create-new', { kernelName: 'python3' })
      .then(widget => {
        // console.log(widget);
        widget.context.ready.then(() => {
          widget.context.model.fromString(
            JSON.stringify({
              cells,
              metadata: {},
              nbformat: 4,
              nbformat_minor: 5
            })
          );
        });
        // widget.context.model.fromJson({ cells });
      });
  }

  // apputils:activate-command-palette

  eventHandler() {
    console.log(this._context);
    console.log(this._commands);
    console.log(this._serviceManager);
    console.log(this._browserFactory);
  }

  // protected onAfterAttach(msg: Message): void {
  //   console.log(2, this._context);
  //   const a = this._browserFactory.createFileBrowser(this.id);
  //   console.log(a);
  // }
  // dispose() {
  //   // this.iframe.removeEventListener('load');
  //   window.removeEventListener('message', this);
  //   console.log('dispose');
  //   super.dispose();
  // }

  // protected filePath: string;
  // private setFilePath() {
  //   this.filePath = this._context.localPath;
  // }

  readonly div: HTMLDivElement;
  // readonly iframe: HTMLIFrameElement;
  private _commands: CommandRegistry;
  private _serviceManager: ServiceManager.IManager;
  private _browserFactory: IFileBrowserFactory;
  private _context: DocumentRegistry.Context;
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
  /**
   * Create a new widget given a context.
   */
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
