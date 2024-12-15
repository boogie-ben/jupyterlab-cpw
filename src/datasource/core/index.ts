import { createApp } from 'vue'
import App from './App.vue'

export const renderDatasource = (node: Element) => {
  createApp(App).mount(node)
}
