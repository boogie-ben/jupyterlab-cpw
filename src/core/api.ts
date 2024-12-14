import { parseCookies } from './utils'

const XSRF_COOKIE_NAME = 'ZY__Secure-csrftoken'
const XSRF_HEADER_NAME = 'X-Csrftoken'

const isDev = import.meta.env.MODE === 'dev'

const cookies = parseCookies(document.cookie)

const request = async <T = any>(
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

/** 获取组件目录 */
export const reqCategories = (): Promise<CPW.CellCategory[]> =>
  request('/api/component/project_categories/')
    .then(data =>
      data.map((cate: any) => {
        const comps = cate.children.map((c: any) => {
          const { category, description, inputConfig, outputConfig, paramsConfig, source, id, name } = c
          return {
            key: id,
            name,
            desc: description?.trim() || '',
            category,
            // bookmark: false,
            paramsConfig: paramsConfig || [],
            incomesConfig: inputConfig || [],
            outgosConfig: outputConfig || [],
            source,
          } as CPW.CellComponent
        }) // todo转换部分字段名

        return {
          id: cate.key,
          name: cate.name,
          children: comps,
        } as CPW.CellCategory
      }),
    )

/** 创建组件配置 */
export const reqCreateComponent = (project_id: number, cell: any) => {
  const { name, desc, category, source, paramsConfig, incomesConfig, outgosConfig } = cell
  const payload = {
    name,
    description: desc,
    category,
    source,
    paramsConfig,
    inputConfig: incomesConfig,
    outputConfig: outgosConfig,
    project_id,
  }
  return request('/api/component/', { method: 'POST', body: JSON.stringify(payload) })
}

/** 删除组件配置 */
export const reqDelComponent = (id: number) => {
  return request(`/api/component/${id}/`, { method: 'DELETE' })
}
