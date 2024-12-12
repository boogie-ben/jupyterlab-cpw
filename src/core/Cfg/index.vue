<template>
  <div class="cpw-cfg">
    <!-- eslint-disable vue/no-v-html -->
    <div class="cpw-cfg-name">{{ activeCell.name }}</div>
    <div class="cpw-cfg-tabs">
      <t-button
        v-for="v, k in tabs"
        :key="k"
        class="cpw-cfg-tab-item"
        :active="currTab === k"
        :content="v"
        variant="text"
        style="border-radius: 0;"
        @click="currTab = k"
      />
    </div>

    <t-form
      v-if="currTab === 'params'"
      label-align="top"
      :data="syncParams"
      class="cpw-cfg-content"
      style="--td-comp-margin-xxl: var(--td-line-height-body-small); --td-comp-paddingLR-xl: 0px;"
    >
      <div
        v-if="!syncParams.length"
        style="text-align: center;"
      >
        无参数配置
      </div>

      <template
        v-for="param,i in syncParams"
        :key="param.name"
      >
        <t-form-item v-if="param.type === 'bool'">
          <div style="flex: 1; width: 0; display: flex; align-items: center;">
            <t-checkbox
              v-model="(param.value as boolean)"
              @change="configChanged('params')"
            />
            <div style="flex: 1; width: 0;">
              <FormLabel
                :config="param"
                hideoptional
              />
            </div>
          </div>
        </t-form-item>

        <t-form-item
          v-else
          :name="`${i}.value`"
          :rules="[{ validator: () => paramValidator(param), message: '请输入合法值', type: 'error', trigger: 'change' }]"
        >
          <template #label><FormLabel :config="param" /></template>
          <t-input
            v-if="param.type === 'str'"
            v-model="(param.value as string)"
            clearable
            style="width: 100%;"
            placeholder="None"
            @change="configChanged('params')"
          />
          <t-select
            v-else-if="param.type === 'opt'"
            v-model="(param.value as string)"
            filterable
            :options="param.options"
            clearable
            style="width: 100%;"
            placeholder="None"
            @change="configChanged('params')"
          />
          <t-input-number
            v-else-if="param.type === 'num'"
            v-model="(param.value as number)"
            theme="column"
            style="width: 100%;"
            placeholder="None"
            @change="configChanged('params')"
          />
        </t-form-item>
      </template>
    </t-form>

    <t-form
      v-else-if="currTab === 'incomes'"
      label-align="top"
      :data="syncIncomes"
      class="cpw-cfg-content"
      style="--td-comp-margin-xxl: var(--td-line-height-body-small); --td-comp-paddingLR-xl: 0px;"
    >
      <div
        v-if="!syncIncomes.length"
        style="text-align: center;"
      >
        无输入配置
      </div>

      <t-form-item
        v-for="income, i in syncIncomes"
        :key="income.name"
        :name="`${i}.value`"
        :required-mark="false"
        :rules="income.required ? [{ required: true, trigger: 'change', type: 'error', message: '请选择输入值' }] : undefined"
      >
        <template #label><FormLabel :config="income" /></template>
        <t-cascader
          v-model="income.value"
          :options="incomeOpts"
          clearable
          filterable
          placeholder="None"
          @change="configChanged('incomes')"
        >
          <!-- <template
            v-if="income.value"
            #valueDisplay="{ selectedOptions }"
          >
            <IncomeRender :selected="selectedOptions" />
          </template> -->
        </t-cascader>
      </t-form-item>
    </t-form>

    <div
      v-else-if="currTab === 'outgos'"
      class="cpw-cfg-content"
    >
      <div
        v-if="!syncOutgos.length"
        style="text-align: center; line-height: 22px;"
      >
        无输出配置
      </div>

      <div
        v-for="out,i in syncOutgos"
        :key="out.name"
        style="
          display: flex;
          align-items: center;
          border-radius: 4px;
          height: 32px;
          padding: 0 12px;
          column-gap: 4px;
          margin: 8px 0;
          background-color: var(--td-bg-color-secondarycontainer);
          color: var(--td-text-color-primary);
        "
      >
        <div
          style="flex: 1; width: 0;"
          class="ellipsis-1"
        >
          {{ out.name }}
        </div>
        <t-tooltip
          v-if="out.desc"
          :content="out.desc"
          placement="top"
        >
          <HelpCircleIcon style="font-size: 14px; line-height: 0; flex-shrink: 0; color: var(--td-brand-color);" />
        </t-tooltip>
        <CloseIcon
          style="font-size: 14px; line-height: 0; flex-shrink: 0; cursor: pointer;"
          @click="delOutput(i)"
        />
      </div>
    </div>

    <div class="cpw-cfg-footer">
      <t-button
        content="重置组件配置"
        variant="text"
        theme="warning"
        block
        style="border-radius: 0;"
        @click="reset"
      >
        <template #icon><RollbackIcon /></template>
      </t-button>
      <div style="height: 1px; background-color: var(--jp-toolbar-border-color);" />
      <t-button
        content="编辑组件配置"
        variant="text"
        theme="primary"
        block
        style="border-radius: 0;"
        @click="edit"
      >
        <template #icon><Edit2Icon /></template>
      </t-button>
    </div>

    <CellEditor
      ref="_CellEditor"
      :cate="cate"
      @done="update"
    />
  </div>
</template>

<script lang="tsx" setup>
import { ref, shallowRef, useTemplateRef } from 'vue'
import { paramValidator } from './utils'
import {
  Button as TButton,
  FormItem as TFormItem,
  Form as TForm,
  Input as TInput,
  InputNumber as TInputNumber,
  Checkbox as TCheckbox,
  Select as TSelect,
  Tooltip as TTooltip,
  Cascader as TCascader,
} from 'tdesign-vue-next'
import { formatCellIncomes, formatCellOutgos, formatCellParams } from '../utils'
import { cloneFnJSON, useThrottleFn } from '@vueuse/core'
import type { CellCategory, CellComponent } from '../Dnd/utils'
import type { Cell } from '@antv/x6'
import { type TdCascaderProps } from 'tdesign-vue-next'
import { showDialog, Dialog, showErrorMessage } from '@jupyterlab/apputils'
import { CloseIcon, HelpCircleIcon, RollbackIcon, Edit2Icon } from 'tdesign-icons-vue-next'
import CellEditor from '../CellEditor/index.vue'

const props = defineProps<{
  activeCell: CPW.Cell
  cate: CellCategory[]
  getPredecessors:(cell: Cell | string) => Cell[]
 }>()

const tabs = { params: '参数', incomes: '输入', outgos: '输出' }
type ConfigType = keyof typeof tabs
const currTab = ref<ConfigType>('params')

interface Emits {
  (e: 'configChanged', id: string, params: Partial<CPW.Cell>): void
}
const emit = defineEmits<Emits>()
const configChanged = useThrottleFn(
  (type: ConfigType | 'reset' | 'info') => {
    emit(
      'configChanged',
      props.activeCell.id,
      {
        ...((type === 'reset' || type === 'params') && { params: syncParams.value.map(c => ({ ...c })) }),
        ...((type === 'reset' || type === 'incomes') && { incomes: syncIncomes.value.map(c => ({ ...c })) }),
        ...((type === 'reset' || type === 'outgos') && { outgos: syncOutgos.value.map(c => ({ ...c })) }),
        ...((type === 'reset' || type === 'info') && syncInfo.value),
        status: 'changed',
      },
    )
  },
  100,
  true,
  false,
)

// * --------------- 参数 ----------------
const syncParams = ref<CPW.CellParam[]>(cloneFnJSON(props.activeCell.params))

const FormLabel = ({ config, hideoptional }: { config: CPW.CellParam | CPW.CellIncome, hideoptional?: boolean }) => {
  return <div style="display: flex; align-items: center; column-gap: 4px;">
    <div class="ellipsis-1">{ config.name }</div>
    { !hideoptional && !config.required && <div style="flex-shrink: 0; color: var(--td-text-color-secondary);">(可选)</div> }
    {
      config.desc && <TTooltip content={config.desc} placement="top">
        <HelpCircleIcon style="flex-shrink: 0; color: var(--td-brand-color); font-size: 16px; line-height: 0;" />
      </TTooltip>
    }
  </div>
}

// * --------------- 输入 ----------------
const incomeOpts = shallowRef<Required<TdCascaderProps>['options']>([])
const incomeOptValues = shallowRef<string[]>([]) // 所有合法值, 用于incomeFixer方便判断
const setIncomeOpts = () => {
  const vals: string[] = []
  incomeOpts.value = props.getPredecessors(props.activeCell.id)
    .map(c => {
      const { id, name, outgos } = c.getData<CPW.Cell>()
      return {
        label: name,
        value: id,
        children: outgos.map(out => {
          const value = `${id}|${out.name}`
          vals.push(value)
          return { label: out.name, value }
        }),
      }
    })
    .filter(o => o.children.length)
  incomeOptValues.value = vals
}

const syncIncomes = ref<CPW.CellIncome[]>(cloneFnJSON(props.activeCell.incomes))

// 检测已有的输入值是否合法，如果有失效值，如本来有的前序连线断开，则需要清除失效的已选输入
const incomeFixer = () => {
  let incomeErr = false
  syncIncomes.value.forEach(income => {
    if (income.value && !incomeOptValues.value.includes(income.value)) {
      incomeErr = true
      income.value = ''
    }
  })
  if (incomeErr) configChanged('incomes')
}

const incomeUpdater = () => {
  // console.log('incomeUpdater')
  setIncomeOpts() // 先更新选项，由选项判断fixer
  incomeFixer()
}
incomeUpdater()

// 暴露方法，当有前序组件或者当前组件断开连接的时候，更新income配置
defineExpose({ incomeUpdater })

// const IncomeRender = ({ selected }: { selected: UnwrapRef<typeof incomeOpts>[number]['children'] }) => {
//   if (!selected.length) return ''
//   const { cellName, label } = selected[0]
//   return <div style="display: flex; align-items: center;">
//     <TTag variant="light" theme="default" shape="square" content={cellName} />
//     <div style="height: 1px; width: 6px; background-color: var(--td-brand-color);" />
//     <TTag variant="light" theme="primary" shape="round" content={label} />
//   </div>
// }
// * --------------- 输出 ----------------
const syncOutgos = ref<CPW.CellOutgo[]>(props.activeCell.outgos.map(c => ({ ...c })))
const delOutput = (idx: number) => {
  syncOutgos.value.splice(idx, 1)
  configChanged('outgos')
}

// * ----------------------
const syncInfo = ref({
  name: props.activeCell.name,
  desc: props.activeCell.desc,
  source: props.activeCell.source,
})

const updateAll = (c: Omit<CellComponent, 'bookmark' | 'key'>) => {
  const { paramsConfig, incomesConfig, outgosConfig, name, desc, source } = c
  syncParams.value = formatCellParams(paramsConfig)
  syncIncomes.value = formatCellIncomes(incomesConfig)
  syncOutgos.value = formatCellOutgos(outgosConfig)
  syncInfo.value = { name, desc, source }
}

const reset = async () => {
  const { button } = await showDialog({
    title: '确认重置组件参数？',
    buttons: [
      Dialog.cancelButton({ label: '取消' }),
      Dialog.warnButton({ label: '重置' }),
    ],
    defaultButton: 0,
  })
  if (button.label !== '重置') return
  const exist = props.cate.find(c => c.children.find(item => {
    if (item.key !== props.activeCell.key) return false
    updateAll(item)
    return true
  }))
  if (exist) configChanged('reset')
  else showErrorMessage('重置组件失败', '组件列表中无此组件，或已被删除')
}

// todo 对话框更新config时，重新执行
const CellEditorRef = useTemplateRef('_CellEditor')
const edit = () => {
  CellEditorRef.value?.openEdit(props.activeCell)
}

const update: InstanceType<typeof CellEditor>['onDone'] = (c) => {
  updateAll(c)
  configChanged('reset')
}

</script>
