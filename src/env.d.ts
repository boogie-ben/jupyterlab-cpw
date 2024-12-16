/// <reference types="vite/client" />

interface Window {

  /** 所有CPW组件复用一份数据，把响应式数据直接保存到window，所有cpw页面都响应 */
  __CPW_DATA: {
    project_id: number

    categories: import('vue').Ref<CPW.CellCategory[]>
    categories_loading: import('vue').Ref<boolean>

    bookmark_component_ids: import('vue').Ref<number[]>
  }

  __DS_DATA: {
    queue: import('vue').Ref<DownloadTask[]>
  }
}
