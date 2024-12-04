import { Graph /* , Path */ } from '@antv/x6'
import { Dnd } from '@antv/x6-plugin-dnd'
import { register } from '@antv/x6-vue-shape'
import CPWNode from './CPWNode.vue'
import { btnIcons } from '../utils'
import { Clipboard } from '@antv/x6-plugin-clipboard'

const portAttrs = {
  circle: {
    r: 4,
    magnet: true,
    stroke: 'var(--cell-border-color)',
    strokeWidth: 1,
    fill: 'var(--cell-port-bg-color)',
    style: { visibility: 'hidden' },
  },
}

register({
  shape: 'cpw-cell-node',
  component: CPWNode,
  height: 40,
  width: 220,
  ports: {
    groups: {
      top: { position: 'top', attrs: portAttrs },
      bottom: { position: 'bottom', attrs: portAttrs },
      left: { position: 'left', attrs: portAttrs },
      right: { position: 'right', attrs: portAttrs },
    },
    items: [
      { id: 'port1', group: 'top' },
      { id: 'port2', group: 'right' },
      { id: 'port3', group: 'bottom' },
      { id: 'port4', group: 'left' },
    ],
  },
})

// Graph.registerConnector(
//   'cpw-connector',
//   (s, e) => {
//     const offset = 4
//     const deltaY = Math.abs(e.y - s.y)
//     const control = Math.floor((deltaY / 3) * 2)

//     const v1 = { x: s.x, y: s.y + offset + control }
//     const v2 = { x: e.x, y: e.y - offset - control }

//     return Path.normalize(
//       `M ${s.x} ${s.y}
//      L ${s.x} ${s.y + offset}
//      C ${v1.x} ${v1.y} ${v2.x} ${v2.y} ${e.x} ${e.y - offset}
//      L ${e.x} ${e.y}
//     `,
//     )
//   },
//   true,
// )

Graph.registerEdge(
  'cpw-edge',
  {
    inherit: 'edge',
    attrs: {
      line: {
        // stroke: '#C2C8D5',
        stroke: 'var(--line-color)',
        strokeWidth: 0.8,
        targetMarker: { name: 'classic', args: { width: 6, height: 4 } },
      },
    },
    zIndex: -1,
  },
  true,
)

export const initGraph = (dom: HTMLElement) => {
  const graph = new Graph({
    container: dom,
    autoResize: true,
    async: true,
    grid: {
      size: 10,
      visible: true,
      type: 'dot',
      args: { color: '#777', thickness: 1 }, // 网格会生成一个base64的图片，不能使用动态css变量
    },
    background: { color: 'var(--grid-bg-color)' },
    panning: true, // 平移
    // port连线
    connecting: {
      anchor: 'center',
      snap: true,
      connectionPoint: 'anchor',
      allowBlank: false,
      allowLoop: false,
      allowMulti: false,
      allowEdge: false,
      allowNode: false,
      highlight: true,
      router: 'metro',
      connector: 'rounded',
      // connector: 'cpw-connector',
      createEdge () {
        return this.createEdge({
          shape: 'cpw-edge',
          attrs: { line: { strokeDasharray: '5 5' } },
        })
      },
    },
    // 连接时高亮port
    highlighting: {
      magnetAdsorbed: {
        name: 'stroke',
        args: { attrs: { stroke: '#0052d9', 'stroke-width': 2 } },
      },
    },
    // 画布缩放
    mousewheel: {
      enabled: true,
      modifiers: ['ctrl', 'meta'],
    },
    scaling: {
      max: 5,
      min: 0.1,
    },
  })

  graph.use(new Clipboard({ enabled: true }))

  graph.on('edge:connected', ({ edge }) => {
    edge.attr({ line: { strokeDasharray: '' } })
  })

  graph.on('edge:mouseenter', ({ edge }) => {
    edge.attr({ line: { stroke: 'var(--line-hover-color)' } })
  })

  graph.on('edge:mouseleave', ({ edge }) => {
    edge.attr({ line: { stroke: 'var(--line-color)' } })
  })

  graph.on('node:mouseenter', ({ node }) => {
    node.getPorts().forEach(port => node.setPortProp(port.id!, ['attrs', 'circle'], { style: { visibility: 'visible' } }))
  })

  graph.on('node:mouseleave', ({ node }) => {
    node.getPorts().forEach(port => node.setPortProp(port.id!, ['attrs', 'circle'], { style: { visibility: 'hidden' } }))
  })

  return graph
}

export const initDnd = (graph: Graph, dndContainer: HTMLElement) => {
  const dnd = new Dnd({
    target: graph,
    dndContainer,
    // draggingContainer, // dnd配置draggingContainer有bug https://github.com/antvis/X6/issues/3978
    scaled: true,
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

export type ContextMenuItem = { label?: string, onClick?: (e: MouseEvent) => any, icon?: keyof typeof btnIcons, divider?: boolean }

export const contextMenuItemHeight = 24
export const contextMenuItemWidth = 200

export const getContextMenuPosition = (items: ContextMenuItem[], mousePosition: { x: number, y: number }) => {
  const { x, y } = mousePosition
  const width = contextMenuItemWidth + 2 // 2px边框
  let itemCount = 0
  let dividerCount = 0
  items.forEach(o => o.divider ? dividerCount++ : itemCount++)

  const height = (itemCount * contextMenuItemHeight) + (dividerCount * 9) + (8 + 2) // menu有固定上下padding各4px, border上下各1px, divider固定为9px

  const menuPos = { x, y }
  // 边界溢出处理
  const flipX = x + width > window.innerWidth
  const flipY = y + height > window.innerHeight
  if (flipX) menuPos.x -= width
  if (flipY) menuPos.y -= height
  return menuPos
}
