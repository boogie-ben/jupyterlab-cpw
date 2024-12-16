interface Team {
  description: string
  name: string
}

interface DataFile {
  /** 父级目录路径 */
  path: string
  /** COS文件路径 */
  key: string
  /** 文件名 */
  filename: string
  size: number
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
  /** cos的文件Key */
  key: string
  /** 下载到jupyter工作目录的目标路径 */
  path: string
  /** 是否下载中 */
  downloading?: boolean
}
