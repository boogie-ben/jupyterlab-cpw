import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';

import { ILauncher } from '@jupyterlab/launcher';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { WidgetTracker } from '@jupyterlab/apputils';
import { CPWDocumentWidget, CPWFactory } from './widget';

import { INotebookCellExecutor } from '@jupyterlab/notebook';

import Icon from '../style/icons/logo.svg';
import { LabIcon } from '@jupyterlab/ui-components';

const cpwIcon = new LabIcon({ name: 'cpw:icon', svgstr: Icon });

const COMMAND = 'cpw:new';

const FACTORY = 'CPW';

function activate(
  app: JupyterFrontEnd,
  launcher: ILauncher,
  restorer: ILayoutRestorer,
  executor: INotebookCellExecutor,
  browserFactory: IFileBrowserFactory
  // menu: IMainMenu
) {
  // const n = new Notebook({''});
  // setCellExecutor(executor);
  // console.log(executor);
  // console.log(app.serviceManager.user);
  const tracker = new WidgetTracker<CPWDocumentWidget>({
    namespace: 'cpw'
  });
  restorer.restore(tracker, {
    command: 'docmanager:open',
    args: widget => ({ path: widget.context.path, factory: FACTORY }),
    name: widget => widget.context.path
  });

  console.log(app);

  const factory = new CPWFactory({
    name: FACTORY,
    fileTypes: ['cpw'],
    defaultFor: ['cpw'],
    commands: app.commands,
    serviceManager: app.serviceManager,
    browserFactory
  });

  factory.widgetCreated.connect((sender, widget) => {
    widget.title.icon = cpwIcon;
    widget.context.pathChanged.connect(() => {
      tracker.save(widget);
    });
    tracker.add(widget);
  });

  app.docRegistry.addWidgetFactory(factory);

  app.docRegistry.addFileType({
    name: 'cpw',
    displayName: 'Workflow',
    // mimeTypes: ['application/dio', 'application/drawio'],
    extensions: ['.cpw'],
    // iconClass: 'jp-MaterialIcon jp-ImageIcon',
    icon: cpwIcon,
    fileFormat: 'text',
    contentType: 'file'
  });

  // 从launcher新建cpw文件
  app.commands.addCommand(COMMAND, {
    label: 'Canvas Pipeline Workflow',
    icon: cpwIcon,
    execute: args => {
      // const cwd = browserFactory.def
      app.commands
        .execute('docmanager:new-untitled', {
          path: args.cwd,
          type: 'file',
          ext: '.cpw'
        })
        .then(model => {
          app.commands.execute('docmanager:open', {
            path: model.path,
            factory: FACTORY
          });
        });
    }
  });

  launcher.add({
    command: COMMAND,
    category: 'Workflow',
    rank: 0
  });
}

/**
 * Initialization data for the canvas-ext extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'cpw:plugin',
  description: 'Enable Canvas Pipeline Workflow.',
  autoStart: true,
  // optional: [],
  requires: [
    ILauncher,
    ILayoutRestorer,
    INotebookCellExecutor,
    IFileBrowserFactory /* , IMainMenu */
  ],
  activate
};

export default plugin;
