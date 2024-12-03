import type { Kernel } from '@jupyterlab/services'
import {
  mdiContentSave,
  mdiPlay,
  mdiSkipNext,
  mdiPlayCircle,
  mdiContentCopy,
  mdiStop,
  mdiRefresh,
  mdiTrashCan,
  mdiMemory,
  mdiMenuOpen,
  mdiMenuClose,
  mdiChevronRight,
} from '@mdi/js'

export const dispatchAction: CPW.DispatchAction = (id, payload) => {
  window.dispatchEvent(new CustomEvent(`cpw-action-${id}`, { detail: payload }))
}

export const kernelStatusLabel: Record<Kernel.Status, string> = {
  autorestarting: '重启中...',
  busy: '繁忙',
  dead: '已关闭',
  idle: '空闲',
  restarting: '重启中...',
  starting: '启动中...',
  terminating: '关闭中...',
  unknown: '连接中...',
}

const mdiSvg = (path: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="${path}" /></svg>`

export const btnIcons = {
  save: mdiSvg(mdiContentSave),
  runSignal: mdiSvg(mdiPlay),
  runToCurrent: mdiSvg(mdiSkipNext),
  runAll: mdiSvg(mdiPlayCircle),
  copy: mdiSvg(mdiContentCopy),
  stop: mdiSvg(mdiStop),
  restart: mdiSvg(mdiRefresh),
  kernel: mdiSvg(mdiMemory),
  delete: mdiSvg(mdiTrashCan),
  menuOpen: mdiSvg(mdiMenuOpen),
  menuClose: mdiSvg(mdiMenuClose),
  chevronRight: mdiSvg(mdiChevronRight),
}

export type BtnIcon = keyof typeof btnIcons

export interface ToolbarBtn {
  title: string
  icon: BtnIcon
  disabled?: boolean
  onClick:(e: MouseEvent) => any
}

export interface NodeComponent extends Pick<CPW.Cell, 'key' | 'name' | 'source'> {
  category: string
  bookmark: boolean
}

export interface NodeCategory {
  id: string
  name: string
  children: NodeComponent[]
}

export const nodeCategory: NodeCategory[] = [
  {
    id: 'cate-1',
    name: 'cate-1',
    children: [
      { key: 'aaaaa', name: 'aaa', source: 'a = 111\na', category: 'cate-1', bookmark: false },
      { key: 'bbbbb', name: 'bbb', source: 'b = 222\nb', category: 'cate-1', bookmark: false },
    ],
  },
  {
    id: 'cate-2',
    name: 'cate-2',
    children: [
      { key: 'ccccc', name: 'ccc', source: 'c = 333\nc', category: 'cate-2', bookmark: false },
    ],
  },
  // { id: 'cate-3', name: 'cate-3', children: [] },
]
