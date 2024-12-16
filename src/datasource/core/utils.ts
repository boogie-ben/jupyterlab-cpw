export function formatBytes (bytes: number) {
  if (typeof bytes !== 'number') return ''
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const maxIndex = sizes.length - 1
  let i = Math.floor(Math.log(bytes) / Math.log(k))
  // 限制单位索引不超过最大单位的索引
  i = Math.min(i, maxIndex)
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
