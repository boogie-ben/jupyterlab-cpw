import { request } from '../../request'
import path from 'path-browserify'

export const reqDatasources = () =>
  request<{ count: number, results: Datasource[] }>('/api/datasource/')
    .then(({ count, results }) => {
      results.forEach(cate => {
        cate.files = cate.files.map((file: any) => {
          const key = path.join(cate.path, file.name)
          return {
            key,
            filename: path.basename(key),
            path: path.dirname(key),
            size: file.size,
            type: file.size,
          }
        })
      })
      return { count, results }
    })