import { request } from '../../request'

/** 获取组件目录 */
export const reqCategories = (): Promise<CPW.CellCategory[]> =>
  request('/api/component/project_categories/', { params: { project_id: window.__CPW_PID } })
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
        })

        return {
          id: cate.key,
          name: cate.name,
          children: comps,
        } as CPW.CellCategory
      }),
    )

/** 创建组件配置 */
export const reqCreateComponent = (cell: any) => {
  const { name, desc, category, source, paramsConfig, incomesConfig, outgosConfig } = cell
  const payload = {
    name,
    description: desc,
    category,
    source,
    paramsConfig,
    inputConfig: incomesConfig,
    outputConfig: outgosConfig,
    project_id: window.__CPW_PID,
  }
  return request('/api/component/', { method: 'POST', body: JSON.stringify(payload) })
}

/** 删除组件配置 */
export const reqDelComponent = (id: number) => request(`/api/component/${id}/`, { method: 'DELETE' })

/** 已收藏组件id */
export const reqBookmarkedComponents = () =>
  request<number[]>('/api/component/project_favorites/', { params: { project_id: window.__CPW_PID } })

/** 收藏组件 */
export const reqBookmarkComponent = (id: number) => request(
  '/api/component/add_project_favorites/',
  {
    method: 'POST',
    body: JSON.stringify({ component_ids: [id], project_id: window.__CPW_PID }),
  },
)

/** 取消收藏组件 */
export const reqUnBookmarkComponent = (id: number) => request(
  '/api/component/remove_project_favorites/',
  {
    method: 'POST',
    body: JSON.stringify({ component_ids: [id], project_id: window.__CPW_PID }),
  },
)
