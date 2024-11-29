import { Graph } from '@antv/x6'
import { Dnd } from '@antv/x6-plugin-dnd'
import { register } from '@antv/x6-vue-shape'
import CPWNode from './CPWNode.vue'

const portAttrs = {
  circle: {
    r: 4,
    magnet: true,
    stroke: '#4787F0',
    strokeWidth: 1,
    fill: '#D4E3FC',
    style: { visibility: 'hidden' },
  },
}

const portConfig = {
  groups: {
    top: {
      position: 'top',
      attrs: portAttrs,
    },
    bottom: {
      position: 'bottom',
      attrs: portAttrs,
    },
    left: {
      position: 'left',
      attrs: portAttrs,
    },
    right: {
      position: 'right',
      attrs: portAttrs,
    },
  },
  items: [
    { id: 'port1', group: 'top' },
    { id: 'port2', group: 'bottom' },
    { id: 'port3', group: 'left' },
    { id: 'port4', group: 'right' },
  ],
}

export const initGraph = (dom: HTMLElement) => {
  register({
    shape: 'cpw-cell-node',
    component: CPWNode,
    ports: portConfig,
  })

  const graph = new Graph({
    container: dom,
    autoResize: true,
    async: true,
    grid: {
      size: 10,
      visible: true,
      type: 'dot',
      args: { color: '#999', thickness: 1 }, // 网格会生成一个base64的图片，不能使用动态css变量
    },
    background: { color: 'var(--cpw-grid-bg-color)' },
    panning: true,
    // interacting: { nodeMovable: false, '' },
    connecting: {
      // anchor: 'center',
      connectionPoint: 'anchor',
      // snap: true, // 自动吸附
      // highlight: true
    },
  })

  return graph
}

export const initDnd = (graph: Graph, dndContainer: HTMLElement, draggingContainer: HTMLElement) => {
  const dnd = new Dnd({
    target: graph,
    dndContainer,
    draggingContainer,
  })

  return dnd
}

export const statusIcon = {
  running: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="#3b77d8" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="16" stroke-dashoffset="16" d="M12 3c4.97 0 9 4.03 9 9"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="16;0"/><animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path><path stroke-dasharray="64" stroke-dashoffset="64" stroke-opacity=".3" d="M12 3c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9c0 -4.97 4.03 -9 9 -9Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="1.2s" values="64;0"/></path></g></svg>',
  error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#d54941" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16m-1-5h2v2h-2zm0-8h2v6h-2z"/></svg>',
  done: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#2ba471" d="M20.985 7.378L10.38 17.985l-6.364-6.364l1.414-1.414l4.95 4.95l9.192-9.193z"/></svg>',
  changed: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#aaa" d="M12 15a3 3 0 1 1 0-6a3 3 0 0 1 0 6Z"/></svg>',
  waiting: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#aaa" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8s8 3.58 8 8s-3.58 8-8 8"/><path fill="#aaa" d="M12.5 7H11v6l5.25 3.15l.75-1.23l-4.5-2.67z"/></svg>',
}
