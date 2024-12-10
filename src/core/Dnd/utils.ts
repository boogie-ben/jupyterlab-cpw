export interface CellComponent extends CPW.CellCommon {
  category: string
  bookmark: boolean
    /** 组件参数配置 */
  paramsConfig: CPW.CellParamConfig[]
  incomesConfig: CPW.CellIncomeConfig[]
  outgos: string[]
}

export interface CellCategory {
  id: string
  name: string
  children: CellComponent[]
}

// todo 接口返回的所有default === null的都换成undefined
export const _cellCategories: CellCategory[] = [
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
        incomesConfig: [
          { name: 'in_1', desc: '输入1', required: true },
          { name: 'in_2', desc: '输入2', required: false },
        ],
        outgos: ['aaa'],
        paramsConfig: [
          { type: 'str', default: 'awdwa', desc: 'str必选', required: true, name: 'str_a' },
          { type: 'str', default: null, desc: 'str可选', required: false, name: 'str_b' },

          { type: 'opt', default: null, desc: 'opt必选', required: true, name: 'opt_a', options: [{ label: 'opt1', value: 'opt1' }, { label: 'opt2', value: 'opt2' }] },
          { type: 'opt', default: null, desc: 'opt可选', required: false, name: 'opt_b', options: [{ label: 'opt1', value: 'opt1' }, { label: 'opt2', value: 'opt2' }] },

          { type: 'num', default: null, desc: 'num必选', required: true, name: 'num_a' },
          { type: 'num', default: null, desc: '', required: false, name: 'num_b' },

          { type: 'bool', default: false, desc: 'bool', required: true, name: 'bool' },
        ],
      },
      {
        category: 'cate-1',
        bookmark: false,
        key: 'bbbbb',
        name: 'bbb',
        source: 'b = 222\nb',
        desc: '',
        incomesConfig: [],
        outgos: [],
        paramsConfig: [],
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
        incomesConfig: [],
        outgos: ['table'],
        paramsConfig: [],
      },
    ],
  },
  // { id: 'cate-3', name: 'cate-3', children: [] },
]
