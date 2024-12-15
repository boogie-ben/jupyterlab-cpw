interface Team {
  description: string
  name: string
}

interface DataFile {
  name: string
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
