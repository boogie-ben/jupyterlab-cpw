import type { IDefaultFileBrowser } from '@jupyterlab/filebrowser'
import { LabIcon, SidePanel } from '@jupyterlab/ui-components'
import { Widget, Panel } from '@lumino/widgets'
import { renderDatasource } from './core'

const Icon = new LabIcon({
  name: 'cpw-datasource:icon',
  svgstr: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3 8h18V5.5q0-.625-.437-1.062T19.5 4h-15q-.625 0-1.062.438T3 5.5zm0 6h18v-4H3zm1.5 6h15q.625 0 1.063-.437T21 18.5V16H3v2.5q0 .625.438 1.063T4.5 20M5 7q-.425 0-.712-.288T4 6t.288-.712T5 5t.713.288T6 6t-.288.713T5 7m0 6q-.425 0-.712-.288T4 12t.288-.712T5 11t.713.288T6 12t-.288.713T5 13m0 6q-.425 0-.712-.288T4 18t.288-.712T5 17t.713.288T6 18t-.288.713T5 19"/></svg>',
})

class DatasourceWidget extends Widget {
  private _filebrowser: IDefaultFileBrowser

  constructor ({ filebrowser }: { filebrowser: IDefaultFileBrowser }) {
    const node = document.createElement('div')
    node.style.height = '100%'
    node.style.width = '100%'
    super({ node })
    this._filebrowser = filebrowser
    this.id = 'cpw-dataource-wdiget'
    renderDatasource(node)
  }
}

export class DatasourcePanel extends SidePanel {
  constructor ({ filebrowser }: { filebrowser: IDefaultFileBrowser }) {
    const panel = new Panel()
    panel.id = 'cpw-dataource-panel'
    panel.addWidget(new DatasourceWidget({ filebrowser }))
    super({ content: panel })
    this.id = 'cpw-datasource'
    this.title.icon = Icon
    this.title.caption = '数据集'
  }
}
