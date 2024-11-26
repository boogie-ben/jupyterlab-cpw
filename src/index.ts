import {
  JupyterFrontEnd,
  type JupyterFrontEndPlugin,
  ILayoutRestorer,
} from '@jupyterlab/application'

import { ILauncher } from '@jupyterlab/launcher'

import { WidgetTracker } from '@jupyterlab/apputils'
import { CPWDocumentWidget, CPWFactory } from './widget'

import Icon from '../style/icons/logo.svg'
import { LabIcon } from '@jupyterlab/ui-components'

const cpwIcon = new LabIcon({ name: 'cpw:icon', svgstr: Icon })

const COMMAND = 'cpw:new'

const FACTORY = 'CPW'

function activate (
  app: JupyterFrontEnd,
  launcher: ILauncher,
  restorer: ILayoutRestorer,
) {
  const tracker = new WidgetTracker<CPWDocumentWidget>({ namespace: 'cpw' })

  restorer.restore(tracker, {
    command: 'docmanager:open',
    args: widget => ({ path: widget.context.path, factory: FACTORY }),
    name: widget => widget.context.path,
  })

  console.log(app)

  const factory = new CPWFactory({
    name: FACTORY,
    fileTypes: ['cpw'],
    defaultFor: ['cpw'],
    commands: app.commands,
    autoStartDefault: true,
    canStartKernel: true,
    // shutdownOnClose: true,
    shutdownOnClose: false,
    preferKernel: true,
  })

  factory.widgetCreated.connect((sender, widget) => {
    widget.title.icon = cpwIcon
    widget.context.pathChanged.connect(() => { tracker.save(widget) })
    tracker.add(widget)
  })

  app.docRegistry.addWidgetFactory(factory)

  app.docRegistry.addFileType({
    name: 'cpw',
    displayName: 'Workflow',
    extensions: ['.cpw'],
    icon: cpwIcon,
    fileFormat: 'text',
    contentType: 'file',
  })

  // 从launcher新建cpw文件
  app.commands.addCommand(COMMAND, {
    label: 'Canvas Pipeline Workflow',
    icon: cpwIcon,
    execute: args => {
      app.commands
        .execute('docmanager:new-untitled', { path: args.cwd, type: 'file', ext: '.cpw' })
        .then(model => app.commands.execute('docmanager:open', { path: model.path, factory: FACTORY }))
    },
  })

  launcher.add({ command: COMMAND, category: 'Workflow', rank: 0 })
}

/**
 * Initialization data for the canvas-ext extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'cpw:plugin',
  description: 'Enable Canvas Pipeline Workflow.',
  autoStart: true,
  // optional: [],
  requires: [ILauncher, ILayoutRestorer],
  activate,
}

export default plugin
