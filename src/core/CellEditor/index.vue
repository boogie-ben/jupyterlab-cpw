<template>
  <t-dialog
    v-model:visible="visible"
    attach="body"
    :close-on-esc-keydown="false"
    :close-on-overlay-click="false"
    width="84%"
    top="8vh"
    :dialog-style="{ height: '80vh' }"
    dialog-class-name="full-content-dialog cpw-cell-editor-dialog"
    :header="modeLabel[mode]"
    :confirm-btn="{ content: '保存', onClick: comfirm, loading }"
    destroy-on-close
    @closed="closed"
    @opened="initEditor"
  >
    <div
      style="height: 100%; overflow: auto; padding-right: 24px; min-width: 950px"
      class="cpw-cell-editor"
    >
      <EditorSection label="组件名称">
        <t-input
          v-model="editCell.name"
          clearable
          style="width: 50%; max-width: 400px;"
          :maxcharacter="30"
          show-limit-number
        />
      </EditorSection>

      <EditorSection label="组件描述">
        <t-textarea
          v-model="editCell.desc"
          clearable
          :autosize="{ maxRows: 3, minRows: 3 }"
          style="width: 50%; max-width: 400px;"
        />
      </EditorSection>

      <EditorSection label="类别">
        <t-select
          v-model="editCell.category"
          clearable
          filterable
          :options="cateOptions"
          :disabled="mode === 'edit'"
          style="width: 50%; max-width: 400px;"
        />
      </EditorSection>

      <EditorSection
        label="参数"
        desc="参数指定的变量名可以直接在组件代码中读取值，若运行时参数值留空，值将会是None。"
      >
        <t-base-table
          row-key="rowKey"
          :data="editCell.paramsConfig"
          :columns="(paramsColumns as any)"
          style="--empty-height: 47px"
        >
          <template #actions="{ rowIndex }">
            <Edit1Icon
              style="line-height: 0; font-size: 16px; color: var(--td-brand-color); cursor: pointer; margin-right: 8px"
              @click="editParam(editCell.paramsConfig[rowIndex])"
            />
            <CloseIcon
              style="line-height: 0; font-size: 16px; color: var(--td-error-color); cursor: pointer;"
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
      </EditorSection>

      <EditorSection
        label="输入"
        desc="输入指定的变量名可以直接在组件代码中读取值，在运行时可指定接收任意上游组件的任意输出值。若运行时无指定输入值，值将会是None"
      >
        <t-base-table
          row-key="rowKey"
          :data="editCell.incomesConfig"
          :columns="(incomesColumns as any)"
        >
          <template #name="{ rowIndex }">
            <t-input
              v-model="editCell.incomesConfig[rowIndex].name"
              style="width: 100%;"
            />
          </template>

          <template #desc="{ rowIndex }">
            <t-input
              v-model="editCell.incomesConfig[rowIndex].desc"
              style="width: 100%;"
            />
          </template>

          <template #required="{ rowIndex }"><t-checkbox v-model="editCell.incomesConfig[rowIndex].required" /></template>

          <template #actions="{ rowIndex }">
            <CloseIcon
              style="line-height: 0; font-size: 16px; color: var(--td-error-color); cursor: pointer;"
              @click="editCell.incomesConfig.splice(rowIndex, 1)"
            />
          </template>

          <template #footerSummary>
            <t-button
              content="新增"
              block
              variant="dashed"
              theme="primary"
              @click="newIncome"
            >
              <template #icon><PlusIcon /></template>
            </t-button>
          </template>
        </t-base-table>
      </EditorSection>

      <EditorSection
        label="输出"
        desc="输出代码中指定的变量名，并且可以被下游组件的输入接收值。注意指定的输出变量必须在组件代码中存在"
      >
        <t-base-table
          row-key="rowKey"
          :data="editCell.outgosConfig"
          :columns="outgosColumns"
        >
          <template #name="{ rowIndex }">
            <t-input
              v-model="editCell.outgosConfig[rowIndex].name"
              style="width: 100%;"
            />
          </template>

          <template #desc="{ rowIndex }">
            <t-input
              v-model="editCell.outgosConfig[rowIndex].desc"
              style="width: 100%;"
            />
          </template>

          <template #actions="{ rowIndex }">
            <CloseIcon
              style="line-height: 0; font-size: 16px; color: var(--td-error-color); cursor: pointer;"
              @click="editCell.outgosConfig.splice(rowIndex, 1)"
            />
          </template>

          <template #footerSummary>
            <t-button
              content="新增"
              block
              variant="dashed"
              theme="primary"
              @click="newOutgo"
            >
              <template #icon><PlusIcon /></template>
            </t-button>
          </template>
        </t-base-table>
      </EditorSection>

      <EditorSection
        label="代码"
        desc="组件代码中请勿使用return"
      >
        <div ref="_code" />
      </EditorSection>
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
        style="--td-comp-margin-xxl: 12px; --td-comp-paddingLR-xl: 0px;"
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
            :autosize="{ maxRows: 2, minRows: 2 }"
            style="width: 100%;"
          />
        </t-form-item>

        <t-form-item label="类型">
          <t-select
            v-model="tempParam.type"
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
          <div style="width: 100%">
            <div style="display: flex; align-items: center; margin-bottom: 4px; padding-right: 20px;">
              <div style="flex: 1; text-align: center">Label</div>
              <div style="flex: 1; text-align: center">Value</div>
            </div>
            <t-input-group
              v-for="opt, i in tempParam.options"
              :key="i"
              style="width: 100%; margin-bottom: 8px; align-items: center;"
            >
              <t-input
                v-model="opt.label"
                style="flex: 1; width: 0;"
                placeholder="Label"
                align="center"
                size="small"
              />
              <t-input
                v-model="opt.value"
                style="flex: 1; width: 0;"
                placeholder="Value"
                align="center"
                size="small"
              />
              <CloseIcon
                style="font-size: 16px; cursor: pointer; margin-left: 4px; line-height: 0"
                @click="tempParam.options!.splice(i, 1)"
              />
            </t-input-group>
            <t-button
              content="添加"
              variant="text"
              block
              theme="primary"
              size="small"
              @click="tempParam.options?.push({ label: '', value: '' })"
            >
              <template #icon><PlusIcon /></template>
            </t-button>
          </div>
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
          label-width="70px"
          label-align="left"
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
  InputGroup as TInputGroup,
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
  MessagePlugin,
  type TableProps,
} from 'tdesign-vue-next'
import { computed, ref, useTemplateRef } from 'vue'
import type { CellComponent, CellCategory } from '../Dnd/utils'
import { objectOmit } from '@vueuse/core'
import { v4 } from 'uuid'
import { PlusIcon, Edit1Icon, CloseIcon } from 'tdesign-icons-vue-next'
import EditorSection from './EditorSection.vue'
import { isLegalPythonIdentifier } from '../utils'
import { CodeEditor } from '@jupyterlab/codeeditor'
import { CodeMirrorEditorFactory, type CodeMirrorEditor } from '@jupyterlab/codemirror'
import { extensions, languages } from './codeEditor'

const props = defineProps<{ cate: CellCategory[] }>()

interface EditorCell extends Pick<CellComponent, 'category' | 'name' | 'desc' | 'source'> {
  incomesConfig: (CPW.CellIncomeConfig & { rowKey?: string })[]
  outgosConfig: (CPW.CellOutgoConfig & { rowKey?: string })[]
  paramsConfig: (CPW.CellParamConfig & { rowKey?: string })[]
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

// * ---------------- 参数 --------------
const paramsColumns: TableProps<EditorCell['paramsConfig'][number]>['columns'] = [
  { title: '变量名', colKey: 'name', width: 250, ellipsis: true },
  { title: '类型', cell: 'type', width: 100 },
  {
    title: '默认值',
    cell: (h, { row }) => row.type === 'bool' ? (row.default ? 'True' : 'False') : (row.default === null ? '' : `${row.default}`),
    ellipsis: true,
  },
  { title: '参数描述', colKey: 'desc', ellipsis: true },
  { title: '是否必填', cell: (h, { row }) => row.required ? '是' : '', width: 100, align: 'center' },
  { title: '操作', cell: 'actions', width: 100, align: 'center' },
]

type ParamType = CPW.CellParamConfig['type']
const paramTypeMap: Record<ParamType, string> = { str: '字符串', num: '数值', opt: '选项', bool: '布尔值' }

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
    editParamKey.value = rowKey!
  }
  editParamVisible.value = true
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
    tempParam.value.default = true
  }
}

const editParamClose = () => {
  tempParam.value = newParam()
  editParamKey.value = null
}
const editParamDone = () => {
  // MessagePlugin
  // const pm = tempParam.value.type === 'opt' ? tempParam.value : objectOmit(tempParam.value, ['options'])
  const pm = { ...tempParam.value }
  if (!isLegalPythonIdentifier(pm.name)) return MessagePlugin.error('变量名不合法')
  if (pm.type === 'opt') {
    if (!pm.options?.length) return MessagePlugin.error('请指定选项')
    if (pm.options.some(o => !o.label || !o.value)) return MessagePlugin.error('选项Label和Value不能为空')
    if (pm.default) {
      if (!pm.options.some(o => o.value === pm.default)) return MessagePlugin.error('指定的默认值不是一个有效的备选项')
    } else pm.default = '' // 避免clear之后undefined
  } else {
    delete pm.options
  }
  if (pm.type === 'num' && typeof pm.default !== 'number') pm.default = null

  if (editParamKey.value) {
    const param = editCell.value.paramsConfig.find(c => c.rowKey === editParamKey.value)
    if (param) Object.assign(param, pm)
  } else {
    editCell.value.paramsConfig.push({ ...pm, rowKey: v4() })
  }
  editParamVisible.value = false
  editParamClose()
}

// * ----------- 输入 --------------
const incomesColumns: TableProps['columns'] = [
  { title: '变量名', cell: 'name', width: 250 },
  { title: '说明', colKey: 'desc' },
  { title: '是否必填', cell: 'required', width: 100, align: 'center' },
  { title: '操作', cell: 'actions', width: 100, align: 'center' },
]

const newIncome = () => {
  editCell.value.incomesConfig.push({ name: '', desc: '', required: true, rowKey: v4() })
}

// * ----------- 输出 --------------
const outgosColumns: TableProps['columns'] = [
  { title: '变量名', cell: 'name', width: 250 },
  { title: '说明', colKey: 'desc' },
  { title: '操作', cell: 'actions', width: 100, align: 'center' },
]

const newOutgo = () => {
  editCell.value.outgosConfig.push({ name: '', desc: '', rowKey: v4() })
}

// * -------------- 代码 -----------------
const codeRef = useTemplateRef('_code')
let editor: CodeMirrorEditor
const initEditor = () => {
  const factory = new CodeMirrorEditorFactory({ extensions, languages })
  const model = new CodeEditor.Model({ mimeType: 'text/x-python' })
  if (editCell.value.source.length) model.sharedModel.setSource(editCell.value.source)
  editor = factory.newInlineEditor({
    host: codeRef.value!,
    model,
    // 可以打印extensions查看所有可选的配置
    config: {
      // mode: 'text/x-python',
      lineNumbers: false,
      lineWrap: false, // 行内容溢出不换行，而是显示滚动条
      // readOnly: false,
    },
  })
}

// * -----------------------
const closed = () => {
  editCell.value = newCell()
  editor?.dispose()
  // @ts-ignore
  editor = null
}
const loading = ref(false)
const comfirm = async () => {
  const { name: _name, desc, category, incomesConfig, outgosConfig, paramsConfig } = editCell.value

  const name = _name.trim()
  if (!name) return MessagePlugin.error('请输入组件名')

  const isNew = mode.value === 'new'

  if (isNew && !category) MessagePlugin.error('请选择组件类别')

  // 参数在新增时已经校验

  for (const income of incomesConfig) {
    if (!isLegalPythonIdentifier(income.name)) return MessagePlugin.error(`输入变量名 "${income.name}" 不合法`)
  }

  for (const outgo of outgosConfig) {
    if (!isLegalPythonIdentifier(outgo.name)) return MessagePlugin.error(`输出变量名 "${outgo.name}" 不合法`)
  }

  const source = editor.model.sharedModel.getSource()
  if (!source.trim()) return MessagePlugin.error('请输入组件代码')

  const cell: EditorCell = {
    name,
    desc,
    category,
    source,
    paramsConfig: paramsConfig.map(o => objectOmit(o, ['rowKey'])),
    incomesConfig: incomesConfig.map(o => objectOmit(o, ['rowKey'])),
    outgosConfig: outgosConfig.map(o => objectOmit(o, ['rowKey'])),
  }

  if (!isNew) {
    visible.value = false
    emit('done', cell)
    return
  }

  loading.value = true
  try {
    await new Promise(r => setTimeout(r, 1000))
    visible.value = false
    emit('done', cell)
  } catch (err: any) {
    MessagePlugin.error(err.message)
  }
  loading.value = false
}

</script>
