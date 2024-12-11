<template>
  <t-dialog
    v-model:visible="visible"
    attach="body"
    :close-on-esc-keydown="false"
    :close-on-overlay-click="false"
    width="80%"
    top="8vh"
    :dialog-style="{ height: '80vh' }"
    dialog-class-name="full-content-dialog cpw-cell-editor-dialog"
    :header="modeLabel[mode]"
    :confirm-btn="{ content: '保存', onClick: comfirm, loading: false }"
    destroy-on-close
    @closed="closed"
  >
    <div
      style="height: 100%; overflow: auto; padding-right: 24px"
      class="cpw-cell-editor"
    >
      <div class="cpw-cell-editor-section">
        <div class="cpw-cell-editor-section-label">组件名称</div>
        <div class="cpw-cell-editor-section-content">
          <t-input
            v-model="editCell.name"
            clearable
            style="width: 50%; max-width: 400px;"
            :maxcharacter="30"
            show-limit-number
          />
        </div>
      </div>

      <div class="cpw-cell-editor-section">
        <div class="cpw-cell-editor-section-label">组件描述</div>
        <div class="cpw-cell-editor-section-content">
          <t-textarea
            v-model="editCell.desc"
            clearable
            :autosize="{ maxRows: 3, minRows: 3 }"
            style="width: 50%; max-width: 400px;"
          />
        </div>
      </div>

      <div class="cpw-cell-editor-section">
        <div class="cpw-cell-editor-section-label">类别</div>
        <div class="cpw-cell-editor-section-content">
          <t-select
            v-model="editCell.category"
            clearable
            filterable
            :options="cateOptions"
            :disabled="mode === 'edit'"
            style="width: 50%; max-width: 400px;"
          />
        </div>
      </div>

      <div class="cpw-cell-editor-section">
        <div class="cpw-cell-editor-section-label">参数</div>
        <div class="cpw-cell-editor-section-content">
          <t-base-table
            row-key="rowKey"
            :data="editCell.paramsConfig"
            :columns="(paramsColumns as any)"
          >
            <template #name="{ rowIndex }">
              {{ editCell.paramsConfig[rowIndex].name }}
              <!-- <t-input
                v-model="editCell.paramsConfig[rowIndex].name"
                clearable
              /> -->
            </template>

            <template #type="{ rowIndex }">{{ paramTypeMap[editCell.paramsConfig[rowIndex].type] }}</template>

            <template #actions="{ rowIndex }">
              <Edit1Icon
                style="line-height: 0; font-size: 16px; color: var(--td-brand-color); cursor: pointer; margin-right: 8px"
                @click="editParam(editCell.paramsConfig[rowIndex])"
              />
              <CloseIcon
                style="line-height: 0; font-size: 16px; color: var(--td-brand-color); cursor: pointer;"
                @click="editCell.paramsConfig.splice(rowIndex, 1)"
              />
            </template>

            <template #footerSummary>
              <t-button
                content="新增"
                block
                variant="dashed"
                theme="primary"
                @click="editParam()"
              >
                <template #icon><PlusIcon /></template>
              </t-button>
            </template>
          </t-base-table>
        </div>
      </div>
    </div>

    <t-drawer
      v-model:visible="editParamVisible"
      show-in-attached-element
      :header="editParamKey ? '编辑参数' : '新增参数'"
      :close-on-esc-keydown="false"
      :close-on-overlay-click="false"
      destroy-on-close
      @close="editParamClose"
      @confirm="editParamDone"
    >
      <t-form
        label-align="top"
        style="--td-comp-margin-xxl: var(--td-line-height-body-small); --td-comp-paddingLR-xl: 0px;"
      >
        <t-form-item label="变量名">
          <t-input
            v-model="tempParam.name"
            style="width: 100%;"
            clearable
          />
        </t-form-item>

        <t-form-item label="参数描述">
          <t-textarea
            v-model="tempParam.desc"
            clearable
            :autosize="{ maxRows: 3, minRows: 3 }"
            style="width: 100%;"
          />
        </t-form-item>

        <t-form-item label="类型">
          <t-select
            v-model="tempParam.type"
            clearable
            :options="paramTypeOpts"
            style="width: 100%;"
            @change="paramTypeChange"
          />
        </t-form-item>

        <t-form-item
          v-if="tempParam.type === 'opt'"
          label="选项"
        >
          <!-- todo 选项配置 -->
        </t-form-item>

        <t-form-item label="默认值">
          <t-input
            v-if="tempParam.type === 'str' || tempParam.type === 'opt'"
            v-model="(tempParam.default as string)"
            placeholder="None"
            style="width: 100%;"
            clearable
          />
          <t-input-number
            v-else-if="tempParam.type === 'num'"
            v-model="(tempParam.default as number)"
            style="width: 100%;"
            placeholder="None"
            theme="column"
          />

          <t-radio-group
            v-else-if="tempParam.type === 'bool'"
            v-model="(tempParam.default as boolean)"
          >
            <t-radio-button :value="true">True</t-radio-button>
            <t-radio-button :value="false">False</t-radio-button>
          </t-radio-group>
        </t-form-item>

        <t-form-item
          v-if="tempParam.type !== 'bool'"
          label="是否必填"
        >
          <t-checkbox v-model="tempParam.required" />
        </t-form-item>
      </t-form>
    </t-drawer>
  </t-dialog>
</template>

<script lang="tsx" setup>
import {
  Dialog as TDialog,
  Input as TInput,
  Textarea as TTextarea,
  Select as TSelect,
  BaseTable as TBaseTable,
  Checkbox as TCheckbox,
  Button as TButton,
  Drawer as TDrawer,
  Form as TForm,
  FormItem as TFormItem,
  InputNumber as TInputNumber,
  RadioGroup as TRadioGroup,
  RadioButton as TRadioButton,
  type TableProps,
} from 'tdesign-vue-next'
import { computed, ref } from 'vue'
import type { CellComponent, CellCategory } from '../Dnd/utils'
import { objectOmit } from '@vueuse/core'
import { v4 } from 'uuid'
import { PlusIcon, Edit1Icon, CloseIcon } from 'tdesign-icons-vue-next'

const props = defineProps<{ cate: CellCategory[] }>()

interface EditorCell extends Pick<CellComponent, 'category' | 'name' | 'desc' | 'source'> {
  incomesConfig: (CPW.CellIncomeConfig & { rowKey: string })[]
  outgosConfig: (CPW.CellOutgoConfig & { rowKey: string })[]
  paramsConfig: (CPW.CellParamConfig & { rowKey: string })[]
}

interface Emits {
  (e: 'done', cell: EditorCell): void
}

const emit = defineEmits<Emits>()

type Mode = 'new' | 'edit'

const visible = ref(false)

const mode = ref<Mode>('new')

const modeLabel = {
  new: '新建组件',
  edit: '编辑组件',
}

const newCell = (): EditorCell => ({
  category: '',
  name: '',
  desc: '',
  source: '',
  incomesConfig: [],
  outgosConfig: [],
  paramsConfig: [],
})

const editCell = ref<EditorCell>(newCell())

function openNew () {
  mode.value = 'new'
  visible.value = true
}

function openEdit (cell: CPW.Cell) {
  const { key, name, desc, source, incomes, outgos, params } = cell
  const category = props.cate.find(c => c.children.some(o => o.key === key))?.id || ''
  editCell.value = {
    category,
    name,
    desc,
    source,
    incomesConfig: incomes.map(income => ({ ...objectOmit(income, ['value']), rowKey: v4() })),
    outgosConfig: outgos.map(o => ({ ...o, rowKey: v4() })),
    paramsConfig: params.map(param => {
      const p = objectOmit(param, ['value'])
      // options避免引用
      if (p.options) p.options = JSON.parse(JSON.stringify(p.options))
      return {
        ...objectOmit(param, ['value']),
        ...(p.options && { options: JSON.parse(JSON.stringify(p.options)) }),
        rowKey: v4(),
      }
    }),
  }

  mode.value = 'edit'
  visible.value = true
}

defineExpose({ openNew, openEdit })

// * ------------ 类别 -----------
const cateOptions = computed(() => props.cate.map(c => ({ label: c.name, value: c.id })))

// todo 校验变量名的合法
// * ---------------- 参数 --------------
const paramsColumns: TableProps<EditorCell['paramsConfig'][number]>['columns'] = [
  { title: '变量名', colKey: 'name', ellipsis: true },
  { title: '类型', cell: 'type', width: 100 },
  {
    title: '默认值',
    cell: (h, { row }) => row.type === 'bool' ? (row.default ? 'True' : 'False') : (row.default === null ? '' : `${row.default}`),
    ellipsis: true,
  },
  { title: '是否必填', cell: (h, { row }) => row.required ? '是' : '', width: 100 },
  { title: '参数描述', colKey: 'desc', ellipsis: true },
  { title: '操作', cell: 'actions', width: 120 },
]

type ParamType = CPW.CellParamConfig['type']
const paramTypeMap: Record<ParamType, string> = {
  str: '字符串',
  num: '数值',
  opt: '选项',
  bool: '布尔值',
}
const paramTypeOpts = Object.entries(paramTypeMap).map(([value, label]) => ({ label, value }))

const newParam = (): Omit<EditorCell['paramsConfig'][number], 'rowKey'> => ({
  name: '',
  type: 'str',
  default: null,
  required: true,
  desc: '',
  options: [],
})

const tempParam = ref(newParam())
const editParamVisible = ref(false)
const editParamKey = ref<string | null>(null)
const editParam = (param?: EditorCell['paramsConfig'][number]) => {
  if (param) {
    const { name, type, default: _dv, required, desc, options, rowKey } = param
    tempParam.value = {
      name,
      type,
      default: _dv,
      required,
      desc,
      options: options ? options.map(o => ({ ...o })) : [],
    }
    editParamKey.value = rowKey
  }
  editParamVisible.value = true
}
const editParamClose = () => {
  tempParam.value = newParam()
  editParamKey.value = null
}
const editParamDone = () => {
  const newP = tempParam.value.type === 'opt' ? tempParam.value : objectOmit(tempParam.value, ['options'])
  // todo 校验
  if (editParamKey.value) {
    const param = editCell.value.paramsConfig.find(c => c.rowKey === editParamKey.value)
    if (param) Object.assign(param, newP)
  } else {
    editCell.value.paramsConfig.push({ ...newP, rowKey: v4() })
  }
  editParamVisible.value = false
  editParamClose()
}
const paramTypeChange = () => {
  switch (tempParam.value.type) {
  case 'opt':
    if (!tempParam.value.options) tempParam.value.options = []
    tempParam.value.default = ''
    break
  case 'str':
    tempParam.value.default = ''
    break
  case 'num':
    tempParam.value.default = null
    break
  case 'bool':
    tempParam.value.default = false
  }
}
/**
 * ---------------- 信息 --------------
 * 组件名 组件描述 类别
 *
 * ---------------- 参数 --------------
 * 变量名 类型 默认值 可选 说明
 *
 * ---------------- 输入 --------------
 * 变量名 可选 说明
 *
 * ---------------- 输出 --------------
 * 变量名
 *
 * ---------------- 代码 --------------
 *
 */

// * -----------------------
const closed = () => {
  editCell.value = newCell()
}

const comfirm = async () => {
  // todo 校验
  // todo 如果是new则调新增接口，并emit
  // todo 如果是edit则直接emit
  visible.value = false
}

// const open: Open = (type, cell) => {

// }

</script>
