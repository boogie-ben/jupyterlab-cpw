import type { IDefaultFileBrowser } from '@jupyterlab/filebrowser'
import { LabIcon, SidePanel } from '@jupyterlab/ui-components'
import { Widget, Panel } from '@lumino/widgets'
import { renderDatasource } from './core'
import { KernelManager, type Kernel } from '@jupyterlab/services'
import { ref } from 'vue'
import path from 'path-browserify'

const Icon = new LabIcon({
  name: 'cpw-datasource:icon',
  svgstr: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3 8h18V5.5q0-.625-.437-1.062T19.5 4h-15q-.625 0-1.062.438T3 5.5zm0 6h18v-4H3zm1.5 6h15q.625 0 1.063-.437T21 18.5V16H3v2.5q0 .625.438 1.063T4.5 20M5 7q-.425 0-.712-.288T4 6t.288-.712T5 5t.713.288T6 6t-.288.713T5 7m0 6q-.425 0-.712-.288T4 12t.288-.712T5 11t.713.288T6 12t-.288.713T5 13m0 6q-.425 0-.712-.288T4 18t.288-.712T5 17t.713.288T6 18t-.288.713T5 19"/></svg>',
})

window.__DS_DATA = {
  queue: ref([]),
}

// todo 换成临时秘钥

const envCode = `
from qcloud_cos import CosConfig
from qcloud_cos import CosS3Client
from qcloud_cos.cos_exception import CosClientError, CosServiceError

config = CosConfig(
    Region='ap-singapore',
    SecretId='IKIDSjndIyb3MTP8pGVZS9fz60iGcmmaBZEn',
    SecretKey='Xr22qdKuQn01rUu495omaCbprjO0QfhW',
)
client = CosS3Client(config)
`

const formatCode = (task: DownloadTask) => `
client.download_file(
    Bucket='lab-1312184455',
    Key='${task.key}',
    DestFilePath='${task.path}'
)
`

class DatasourceWidget extends Widget {
  private _filebrowser: IDefaultFileBrowser
  private _kernelManager = new KernelManager()
  private _kernel?: Kernel.IKernelConnection
  private _running = false
  private _pwd = ''
  // private _queue = [] as { file: string, path }[]

  constructor ({ filebrowser, serverRoot }: { filebrowser: IDefaultFileBrowser, serverRoot: string }) {
    const node = document.createElement('div')
    node.style.height = '100%'
    node.style.width = '100%'
    super({ node })
    this._filebrowser = filebrowser
    this.id = 'cpw-dataource-wdiget'
    this._pwd = serverRoot
    if (this._kernelManager.isReady) this.newKernel()
    else this._kernelManager.ready.then(() => this.newKernel())
    window.addEventListener('datasource-add-task', this)
    renderDatasource(node)
    console.log(this)
  }

  async newKernel () {
    this._kernel = await this._kernelManager.startNew({ name: 'python' })
    const future = this._kernel.requestExecute({ code: envCode })
    await future.done
    future.dispose()
    this._running = false
  }

  addTask (key: string, filename: string) {
    const downloadPath = path.join(this._pwd, this._filebrowser.model.path, filename)
    window.__DS_DATA.queue.value.push({ key, path: downloadPath })
    if (!this._running) this.download()
  }

  async download () {
    // 避免用户在内核管理里面把内核关掉了, 确保创建新的
    if (!this._kernel || this._kernel.isDisposed) await this.newKernel()
    const task = window.__DS_DATA.queue.value[0]
    if (!task) {
      this._running = false
      return
    }
    this._running = true
    task.downloading = true
    const code = formatCode(task)
    const future = this._kernel!.requestExecute({ code })
    future.onIOPub = msg => {
      // todo 失败提醒
      if (msg.header.msg_type === 'error') console.log('下载失败')
    }
    await future.done
    future.dispose()
    task.downloading = false
    window.__DS_DATA.queue.value.splice(0, 1)
    if (window.__DS_DATA.queue.value.length) this.download()
    else this._running = false
  }

  handleEvent (e: CustomEvent<{ key: string, filename: string }>) {
    this.addTask(e.detail.key, e.detail.filename)
  }
}

export class DatasourcePanel extends SidePanel {
  constructor (options: { filebrowser: IDefaultFileBrowser, serverRoot: string }) {
    const panel = new Panel()
    panel.id = 'cpw-dataource-panel'
    panel.node.style.height = '100%'
    panel.node.style.width = '100%'
    panel.addWidget(new DatasourceWidget(options))
    super({ content: panel })
    this.id = 'cpw-datasource'
    this.title.icon = Icon
    this.title.caption = '数据集'
  }
}
