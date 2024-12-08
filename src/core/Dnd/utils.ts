export interface CellComponent extends CPW.CellCommon {
  category: string
  bookmark: boolean
}

export interface CellCategory {
  id: string
  name: string
  children: CellComponent[]
}

export const cellCategory: CellCategory[] = [
  {
    id: 'cate-1',
    name: 'cate-1',
    children: [
      {
        category: 'cate-1',
        bookmark: false,
        name: 'aaa',
        key: 'aaaaa',
        source: 'aaa = 111\nbbb = 333',
        desc: '',
        incomes: [/* { fromId: 'adwdc-12d21', fromName: 'ddd', name: 'ccc', desc: '' } */],
        outgos: ['aaa'],
        params: [
          { name: 'p1', type: 'boolean', value: true, desc: '' },
          { name: 'p2', type: 'option', value: 'opt-value', desc: '' },
          { name: 'p3', type: 'string', value: 'str-value', desc: '' },
          { name: 'p4', type: 'number', value: 2.1, desc: '' },
        ],
      },
      {
        category: 'cate-1',
        bookmark: false,
        key: 'bbbbb',
        name: 'bbb',
        source: 'b = 222\nb',
        desc: '',
        incomes: [],
        outgos: [],
        params: [],
      },
    ],
  },
  {
    id: 'cate-2',
    name: 'cate-2',
    children: [
      {
        category: 'cate-2',
        bookmark: false,
        key: 'ccccc',
        name: 'ccc',
        source: 'import IPython\nimport pandas as pd\n\ndf = pd.read_csv(\'./sample4.csv\')\ntable = df.describe()\n# IPython.display.display(table)\ntable',
        desc: '',
        incomes: [],
        outgos: ['table'],
        params: [],
      },
    ],
  },
  // { id: 'cate-3', name: 'cate-3', children: [] },
]
