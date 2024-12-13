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
} from '@mdi/js'

export const dispatchAction: CPW.DispatchAction = (id, payload) => {
  window.dispatchEvent(new CustomEvent(`cpw-action-${id}`, { detail: payload }))
}

// todo 内核名称、点击切换内核
export const kernelStatusLabel: Record<Kernel.Status, string> = {
  autorestarting: '重启中...',
  busy: '繁忙',
  dead: '已关闭',
  idle: '空闲',
  restarting: '重启中...',
  starting: '启动中...',
  terminating: '关闭中...',
  unknown: '未知',
}

const mdiSvg = (path: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="${path}" /></svg>`

/** 给toolbar和contextmenu用的svg字符串，方便传参，并且避免了t-icon的svg精灵图请求 */
export const btnIcons = {
  save: mdiSvg(mdiContentSave),
  runSingle: mdiSvg(mdiPlay),
  runToCurrent: mdiSvg(mdiSkipNext),
  runAll: mdiSvg(mdiPlayCircle),
  copy: mdiSvg(mdiContentCopy),
  stop: mdiSvg(mdiStop),
  restart: mdiSvg(mdiRefresh),
  kernel: mdiSvg(mdiMemory),
  delete: mdiSvg(mdiTrashCan),
  menuOpen: mdiSvg(mdiMenuOpen),
  menuClose: mdiSvg(mdiMenuClose),
}

export type BtnIcon = keyof typeof btnIcons

export type ToolbarBtn = {
  title: string
  icon: BtnIcon
  disabled?: boolean
  onClick:(e: MouseEvent) => any
}

// Python 3.11 中的关键字列表，可根据Python版本更新此列表
const pythonKeywords = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
]
const pyidReg = /^[a-zA-Z_][a-zA-Z0-9_]*$/
/** 判断是否为python的合法标识符 */
export const isLegalPythonIdentifier = (name: string) => {
  if (!name || !pyidReg.test(name)) return false
  return !pythonKeywords.includes(name)
}

// * ----------- 解析cookie ---------------
// https://github.com/jshttp/cookie/blob/master/src/index.ts
function startIndex (str: string, index: number, max: number) {
  do {
    const code = str.charCodeAt(index)
    if (code !== 0x20 /*   */ && code !== 0x09 /* \t */) return index
  } while (++index < max)
  return max
}

function endIndex (str: string, index: number, min: number) {
  while (index > min) {
    const code = str.charCodeAt(--index)
    if (code !== 0x20 /*   */ && code !== 0x09 /* \t */) return index + 1
  }
  return min
}

export function parseCookies (str: string): Record<string, string | undefined> {
  const obj: Record<string, string | undefined> = Object.create(null)
  const len = str.length
  // RFC 6265 sec 4.1.1, RFC 2616 2.2 defines a cookie name consists of one char minimum, plus '='.
  if (len < 2) return obj

  let index = 0

  do {
    const eqIdx = str.indexOf('=', index)
    if (eqIdx === -1) break // No more cookie pairs.

    const colonIdx = str.indexOf(';', index)
    const endIdx = colonIdx === -1 ? len : colonIdx

    if (eqIdx > endIdx) {
      // backtrack on prior semicolon
      index = str.lastIndexOf(';', eqIdx - 1) + 1
      continue
    }

    const keyStartIdx = startIndex(str, index, eqIdx)
    const keyEndIdx = endIndex(str, eqIdx, keyStartIdx)
    const key = str.slice(keyStartIdx, keyEndIdx)

    // only assign once
    if (obj[key] === undefined) {
      const valStartIdx = startIndex(str, eqIdx + 1, endIdx)
      const valEndIdx = endIndex(str, endIdx, valStartIdx)

      const value = str.slice(valStartIdx, valEndIdx)
      obj[key] = value
    }

    index = endIdx + 1
  } while (index < len)

  return obj
}
