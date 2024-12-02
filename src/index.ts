import {
  JupyterFrontEnd,
  type JupyterFrontEndPlugin,
  ILayoutRestorer,
} from '@jupyterlab/application'

import { ILauncher } from '@jupyterlab/launcher'
import { WidgetTracker } from '@jupyterlab/apputils'
import { CPWDocumentWidget, CPWFactory } from './widget'

// import Icon from './icons/logo.svg'
import { LabIcon } from '@jupyterlab/ui-components'

import 'tdesign-vue-next/es/style/index.css'

// console.log(Icon)
const Icon = 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'><path fill=\'none\' stroke=\'#f37626\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M3 4c0-1.655.345-2 2-2h4c1.655 0 2 .345 2 2s-.345 2-2 2H5c-1.655 0-2-.345-2-2m10 9c0-1.655.345-2 2-2h4c1.655 0 2 .345 2 2s-.345 2-2 2h-4c-1.655 0-2-.345-2-2m-9 7c0-1.655.345-2 2-2h4c1.655 0 2 .345 2 2s-.345 2-2 2H6c-1.655 0-2-.345-2-2m13-9c0-.465 0-.697-.038-.89a2 2 0 0 0-1.572-1.572c-.193-.038-.425-.038-.89-.038h-5c-.465 0-.697 0-.89-.038A2 2 0 0 1 7.038 6.89C7 6.697 7 6.465 7 6m10 9v1c0 1.886 0 2.828-.586 3.414S14.886 20 13 20h-1\' color=\'#f37626\'/></svg>'

const cpwIcon = new LabIcon({ name: 'cpw:icon', svgstr: Icon })

const COMMAND = 'cpw:new'

const FACTORY = 'CPW'

function activate (
  app: JupyterFrontEnd,
  launcher: ILauncher,
  restorer: ILayoutRestorer,
) {
  const tracker = new WidgetTracker<CPWDocumentWidget>({ namespace: 'cpw' })

  const obcb = () => {
    console.log(document.body.getAttribute('data-jp-theme-light'))
    if (JSON.parse(document.body.getAttribute('data-jp-theme-light') || 'true')) {
      document.documentElement.removeAttribute('theme-mode')
    } else {
      document.documentElement.setAttribute('theme-mode', 'dark')
    }
  }
  const ob = new MutationObserver(obcb)
  ob.observe(document.body, { attributeFilter: ['data-jp-theme-light'] })
  obcb() // 有时候会不自动执行，手动执行一次

  restorer.restore(tracker, {
    command: 'docmanager:open',
    args: widget => ({ path: widget.context.path, factory: FACTORY }),
    name: widget => widget.context.path,
  })

  // console.log(app.contextMenu)

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

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'cpw:plugin',
  description: 'Enable Canvas Pipeline Workflow.',
  autoStart: true,
  // optional: [],
  requires: [ILauncher, ILayoutRestorer],
  activate,
}

export default plugin
