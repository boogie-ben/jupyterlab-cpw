import { createApp, ref } from 'vue'
import App from './App.vue'
import { reqBookmarkedComponents } from './api'
import { MessagePlugin } from 'tdesign-vue-next'

/**
 * 所有CPW组件复用一份数据，把响应式数据直接保存到window，所有cpw页面都响应
 * 多个cpw同时挂载确保只初始化一次，在vue部分直接访问使用
 */
if (!Object.hasOwnProperty.call(window, '__CPW_DATA')) {
  window.__CPW_DATA = {
    project_id: 123123,
    categories: ref([]),
    categories_loading: ref(false),

    bookmark_component_ids: ref([]),
  }
}
const getBookmark = () => {
  reqBookmarkedComponents()
    .then(data => { window.__CPW_DATA.bookmark_component_ids.value = data })
    .catch((err: any) => { MessagePlugin.error('获取收藏组件失败: ' + err.message) })
}
getBookmark()

export const renderCPW = (node: Element, id:string, content: string) => {
  createApp(<App id={id} fileContent={JSON.parse(content)} />).mount(node)
}
