import { ServiceManager } from '@jupyterlab/services';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { CommandRegistry } from '@lumino/commands';
import { Widget } from '@lumino/widgets';
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget
} from '@jupyterlab/docregistry';

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
    // this.filePath = this._context.localPath;

    // // 移动文件目录、改文件名
    // this._context.pathChanged.connect(() => {
    //   this.filePath = this._context.localPath;
    // }, this);

    const iframe = document.createElement('iframe');

    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    this.addClass('jp-canvas-pipeline-workflow-content');
    this.iframe = iframe;
    this.node.appendChild(this.iframe);

    this._context.ready.then(() => this.init());

    // window.addEventListener('message', this)

    // setTimeout(() => {
    //   this._context.model.fromString('sdfgfvgver');
    // }, 3000);
  }

  init() {
    const src = new URL('http://127.0.0.1:5500/iframe.html');
    src.searchParams.set('id', this.id);
    this.iframe.src = src.href;
    window.addEventListener('message', this);
  }

  // iframe message 事件
  handleEvent(e: MessageEvent): void {
    const { id, msg, source, value } = e.data;
    if (source !== 'cpw:msg' || id !== this.id) {
      return;
    }

    const actions: Record<string, any> = {
      save: () => this._commands.execute('docmanager:save'),
      change: () => this._context.model.fromString(value || ''),
      'command-palette': () =>
        this._commands.execute('apputils:activate-command-palette')
    };

    actions[msg as string]?.();
  }

  // apputils:activate-command-palette

  eventHandler() {
    console.log(this._commands);
    console.log(this._serviceManager);
    console.log(this._browserFactory);
  }

  // protected onAfterAttach(msg: Message): void {
  //   console.log(2, this._context);
  //   const a = this._browserFactory.createFileBrowser(this.id);
  //   console.log(a);
  // }
  dispose() {
    // this.iframe.removeEventListener('load');
    window.removeEventListener('message', this);
    console.log('dispose');
    super.dispose();
  }

  // protected filePath: string;
  // private setFilePath() {
  //   this.filePath = this._context.localPath;
  // }

  readonly iframe: HTMLIFrameElement;
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
