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

function parseCookies (str: string): Record<string, string | undefined> {
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

const XSRF_COOKIE_NAME = 'ZY__Secure-csrftoken'
const XSRF_HEADER_NAME = 'X-Csrftoken'

const isDev = import.meta.env.MODE === 'dev'

const cookies = parseCookies(document.cookie)

export const request = async <T = any>(
  url: string,
  init?: RequestInit & { params?: Record<string, any> },
): Promise<T> => {
  // 开发环境先跑dev-proxy.js脚本
  const u = new URL(url, isDev ? 'http://localhost:8889' : window.location.origin)
  if (init?.params) Object.entries(init.params).forEach(([key, value]) => u.searchParams.set(key, value))

  const res = await fetch(u.href, {
    headers: {
      [XSRF_HEADER_NAME]: cookies[XSRF_COOKIE_NAME] || '',
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    credentials: isDev ? 'include' : 'same-origin',
    ...init,
  })

  if (!res.ok) throw new Error(res.status + ' ' + res.statusText)

  const data = await res.json()

  if (data.code !== 200) return Promise.reject(data)
  return data.data
}
