import { createApp } from 'vue'
import App from './App.vue'

export const renderCpw = (node: Element, content: string) => {
  createApp(<App content={content} />)
    .mount(node)
}
