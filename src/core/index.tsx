import { createApp } from 'vue'
import App from './App.vue'

export const renderCPW = (node: Element, id:string, content: string) => {
  createApp(<App id={id} fileContent={JSON.parse(content)} />).mount(node)
}
