export interface NodeComponent extends Pick<CPW.Cell, 'key' | 'name' | 'source'> {
  category: string
  bookmark: boolean
}

export interface NodeCategory {
  id: string
  name: string
  children: NodeComponent[]
}

export const nodeCategory: NodeCategory[] = [
  {
    id: 'cate-1',
    name: 'cate-1',
    children: [
      { key: 'aaaaa', name: 'aaa', source: 'a = 111\na', category: 'cate-1', bookmark: false },
      { key: 'bbbbb', name: 'bbb', source: 'b = 222\nb', category: 'cate-1', bookmark: false },
    ],
  },
  {
    id: 'cate-2',
    name: 'cate-2',
    children: [
      { key: 'ccccc', name: 'ccc', source: 'import IPython\nimport pandas as pd\n\ndf = pd.read_csv(\'./demo_subject_id.csv\')\ntable = df.describe()\n# IPython.display.display(table)\ntable', category: 'cate-2', bookmark: false },
    ],
  },
  // { id: 'cate-3', name: 'cate-3', children: [] },
]
