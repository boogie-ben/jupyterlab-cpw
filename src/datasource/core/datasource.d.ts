interface Team {
  description: string
  name: string
}

interface DataFile {
  /** COS文件完整路径 */
  key: string
  /** dirname目录路径，相当于key没有filename部分 */
  path: string
  /** 文件名 */
  filename: string
  size: number
  size_str: string
  type: string
}

interface Datasource {
  id: number
  team_id: number | null
  created_by: string
  created_at: string
  updated_by: string | null
  updated_at: string | null
  description: string
  name: string
  image: string
  path: string
  belong: string
  read_me: string
  team: Team,
  favorite: boolean
  files: DataFile[]
}

interface DownloadTask {
  /** cos的文件完整Key */
  key: string

  /** 下载至目标路径的目录，也就是当前打开的目录 */
  dirname: string

  filename: string
  /** 是否下载中 */
  downloading?: boolean
  sizeStr: string
}
