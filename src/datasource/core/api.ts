import { request } from '../../request'

export const reqDatasources = () => request<{ count: number, results: Datasource[] }>('/api/datasource/')
