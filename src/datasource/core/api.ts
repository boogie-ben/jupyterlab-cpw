import { request } from '../../request'
import { formatBytes } from './utils'
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
            size_str: formatBytes(file.size),
            type: file.type,
          }
        })
      })
      return { count, results }
    })

export interface CosTmpCredential {
  cos: { bucket: string, region: 'ap-singapore' },
  credentials: { sessionToken: string, tmpSecretId: string, tmpSecretKey: string }
  expiration: string
  expiredTime: number
  startTime: number
}

export const reqCosTmpCredential = (fileKey: string) =>
  request<CosTmpCredential>('/api/cos/temp_credential/', { method: 'POST', body: JSON.stringify({ prefix: fileKey }) })
